const { fork } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'samples');
fs.mkdirSync(folder, { recursive: true });
const child = fork(path.join(root, 'dist/native/kokoro-worker.cjs'), [path.join(root, 'models/kokoro')], { serialization: 'advanced', stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
child.stderr.on('data', data => process.stderr.write(data));
child.stdout.on('data', () => {});
const requests = new Map();
let readyResolve, readyReject;
const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
const started = performance.now();
let warmupMs;
child.on('message', message => {
  if (message.type === 'loading') console.log(message.message);
  if (message.type === 'ready') { warmupMs = Math.round(performance.now() - started); readyResolve(message); }
  if (message.type === 'error' && message.id === undefined) readyReject(new Error(message.message));
  const request = requests.get(message.id);
  if (!request) return;
  if (message.type === 'audio') { request.audio.push(message); child.send({ type: 'consumed', id: message.id }); }
  if (message.type === 'generated') { clearTimeout(request.timer); requests.delete(message.id); request.resolve(request.audio); }
  if (message.type === 'error') { clearTimeout(request.timer); requests.delete(message.id); request.reject(new Error(message.message)); }
});
function generate(id, text, voice = 'af_heart', rate = 0) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Speech ${id} timed out`)), 90000);
    requests.set(id, { audio: [], resolve, reject, timer });
    child.send({ type: 'speak', id, text, voice, rate });
  });
}
function saveWav(name, chunks) {
  assert.ok(chunks.length > 0, 'No audio chunks');
  const samples = Float32Array.from(chunks.flatMap(chunk => Array.from(chunk.samples)));
  assert.ok(samples.length > 2400 && samples.every(Number.isFinite));
  const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
  assert.ok(rms > 0.001, 'Audio is silent');
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(folder, name), wav);
  return { seconds: samples.length / 24000, synthesisMs: chunks.reduce((sum, chunk) => sum + chunk.synthesisMs, 0), cached: chunks.every(chunk => chunk.cacheHit), rms, chunks: chunks.length };
}
const timeout = setTimeout(() => { console.error('Kokoro test timed out'); child.kill(); process.exitCode = 1; }, 240000);
async function run() {
  await ready;
  const reports = {};
  reports.word = saveWav('01-heart-word.wav', await generate(1, 'Curiosity.'));
  const sentence = 'Curiosity opens the door to learning. Every small step makes a difference.';
  reports.heart = saveWav('02-heart-sentence.wav', await generate(2, sentence));
  reports.cached = saveWav('03-heart-cached.wav', await generate(3, sentence));
  assert.equal(reports.cached.cached, true, 'Repeat did not use cache');
  reports.bella = saveWav('04-bella-sentence.wav', await generate(4, sentence, 'af_bella'));
  reports.emma = saveWav('05-emma-sentence.wav', await generate(5, sentence, 'bf_emma'));
  reports.slow = saveWav('06-heart-slow.wav', await generate(6, 'Particularly comfortable.', 'af_heart', -3));
  const long = 'The reader should hear every sentence, including the final sentence. '.repeat(6);
  reports.paragraph = saveWav('07-heart-paragraph.wav', await generate(7, long));
  assert.ok(reports.paragraph.chunks >= 6, 'Paragraph was truncated');
  child.send({ type: 'speak', id: 10, text: 'A long generation that will be cancelled. '.repeat(100), voice: 'af_heart', rate: 0 });
  child.send({ type: 'stop', id: 11 });
  reports.afterStop = saveWav('08-after-stop.wav', await generate(12, 'Ready to read again.'));
  const report = { engine: 'Kokoro-82M fp32 CPU', network: 'fetch disabled in worker', warmupMs, reports, passed: true, at: new Date().toISOString() };
  fs.writeFileSync(path.join(folder, 'test-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { clearTimeout(timeout); for (const request of requests.values()) clearTimeout(request.timer); child.kill(); });
