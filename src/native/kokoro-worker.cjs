// Runs in a separate Electron/Node process. No text, audio or model requests leave the machine.
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { kokoroVoices, kokoroVoice, kokoroSpeed, speechChunks, AudioCache } = require('../speech-core.js');
let tts;
let currentId = -1;
let pending = null;
let busy = false;
let credits = 2;
let creditWaiter;
const cache = new AudioCache();
const send = (type, data = {}) => { if (process.connected) process.send({ type, ...data }); };
function wake() { const resolve = creditWaiter; creditWaiter = null; resolve?.(); }
async function load() {
  const directory = process.argv[2];
  if (!directory || !fs.existsSync(path.join(directory, 'onnx/model.onnx'))) throw new Error('缺少 Kokoro 本地模型，请运行 npm run model:download。');
  const hf = require('@huggingface/transformers');
  hf.env.allowRemoteModels = false;
  hf.env.allowLocalModels = true;
  hf.env.useFSCache = false;
  hf.env.useBrowserCache = false;
  globalThis.fetch = async () => { throw new Error('Kokoro 离线模式不允许网络请求'); };
  const { KokoroTTS } = require('kokoro-js');
  send('loading', { message: '正在载入 Kokoro 本地模型…' });
  const [model, tokenizer] = await Promise.all([
    hf.StyleTextToSpeech2Model.from_pretrained(directory, {
      device: 'cpu', dtype: 'fp32', local_files_only: true,
      session_options: { intraOpNumThreads: Math.max(1, Math.min(4, os.availableParallelism() - 1)), interOpNumThreads: 1, executionMode: 'sequential', graphOptimizationLevel: 'all' }
    }),
    hf.AutoTokenizer.from_pretrained(directory, { local_files_only: true })
  ]);
  // Upstream generate() truncates at the context limit. Explicitly reject and split instead.
  const guardedTokenizer = new Proxy(tokenizer, { apply(target, thisArg, args) {
    const result = Reflect.apply(target, thisArg, [args[0], { ...args[1], truncation: false }]);
    if (result.input_ids.dims.at(-1) > 510) { const error = new Error('PHONEMES_TOO_LONG'); error.code = 'PHONEMES_TOO_LONG'; throw error; }
    return result;
  } });
  tts = new KokoroTTS(model, guardedTokenizer);
  send('loading', { message: '正在预热 Kokoro，美音 Heart…' });
  const warm = await tts.generate('Hello.', { voice: 'af_heart', speed: 1 });
  validateAudio(warm.audio);
  cache.set(JSON.stringify(['af_heart', 1, 'Hello.']), warm.audio);
  send('ready', { voices: kokoroVoices, precision: 'fp32', device: 'cpu' });
}
function validateAudio(audio) {
  if (!(audio instanceof Float32Array) || audio.length < 240 || !audio.every(Number.isFinite)) throw new Error('Kokoro 返回了无效的音频');
}
async function runPending() {
  if (busy || !tts) return;
  busy = true;
  try {
    while (pending) {
      const request = pending; pending = null;
      const id = request.id;
      const voice = kokoroVoice(request.voice);
      const speed = kokoroSpeed(request.rate);
      const chunks = speechChunks(request.text);
      let index = 0;
      try {
        while (chunks.length && currentId === id) {
          while (credits <= 0 && currentId === id) await new Promise(resolve => { creditWaiter = resolve; });
          if (currentId !== id) break;
          const text = chunks.shift();
          const key = JSON.stringify([voice, speed, text]);
          let audio = cache.get(key);
          const hit = Boolean(audio), started = performance.now();
          if (!audio) {
            try { audio = (await tts.generate(text, { voice, speed })).audio; }
            catch (error) {
              if (error.code !== 'PHONEMES_TOO_LONG') throw error;
              const spaces = Array.from(text.matchAll(/\s+/g), m => m.index);
              if (!spaces.length) throw new Error('这段文本的发音过长，请分段选中后朗读。');
              const split = spaces.reduce((a, b) => Math.abs(a - text.length / 2) < Math.abs(b - text.length / 2) ? a : b);
              chunks.unshift(text.slice(0, split).trim(), text.slice(split).trim()); continue;
            }
            validateAudio(audio); cache.set(key, audio);
          }
          if (currentId !== id) break;
          credits--;
          send('audio', { id, index: index++, samples: audio, sampleRate: 24000, cacheHit: hit, synthesisMs: Math.round(performance.now() - started) });
        }
        if (currentId === id) send('generated', { id, chunks: index });
      } catch (error) { if (currentId === id) send('error', { id, message: error.message }); }
    }
  } finally { busy = false; }
}
process.on('message', message => {
  if (message.type === 'quit') process.exit(0);
  if (message.type === 'speak') {
    currentId = message.id; pending = message; credits = 2; wake(); void runPending();
  }
  if (message.type === 'stop') { currentId = message.id; pending = null; credits = 2; wake(); }
  if (message.type === 'consumed' && message.id === currentId) { credits++; wake(); }
});
process.on('disconnect', () => process.exit(0));
load().catch(error => { send('error', { message: error.message }); process.exitCode = 1; });
