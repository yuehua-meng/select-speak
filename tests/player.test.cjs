const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function player() {
  let command;
  const reports = [], resumes = [], sources = [];
  class Context {
    sampleRate = 24000; currentTime = 0; destination = {};
    resume() { return new Promise(resolve => resumes.push(resolve)); }
    createBuffer() { return { duration: 1, copyToChannel() {} }; }
    createBufferSource() {
      const source = { onended: null, stopped: false, connect() {}, disconnect() {}, start() {}, stop() { this.stopped = true; } };
      sources.push(source); return source;
    }
  }
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/audio-player.js'), 'utf8'), {
    window: { audioEngine: { onCommand(fn) { command = fn; }, report(value) { reports.push(value); } } },
    AudioContext: Context, Float32Array, Set
  });
  return { send: value => command(value), reports, resumes, sources };
}
const audio = id => ({ type: 'chunk', id, samples: new Float32Array(240), sampleRate: 24000, index: 0 });
test('end-of-generation cannot complete playback before AudioContext resumes', async () => {
  const p = player(); p.send({ type: 'start', id: 1 }); p.send(audio(1)); p.send({ type: 'end', id: 1 });
  assert.equal(p.reports.some(r => r.type === 'done'), false);
  p.resumes.shift()(); await Promise.resolve();
  assert.equal(p.sources.length, 1); assert.equal(p.reports.some(r => r.type === 'done'), false);
  p.sources[0].onended(); assert.equal(p.reports.at(-1).type, 'done');
});
test('stop discards an in-flight resume and new selection never plays stale audio', async () => {
  const p = player(); p.send({ type: 'start', id: 1 }); p.send(audio(1));
  p.send({ type: 'stop', id: 2 }); p.send({ type: 'start', id: 3 }); p.send(audio(3));
  p.resumes.shift()(); await Promise.resolve(); assert.equal(p.sources.length, 0);
  p.resumes.shift()(); await Promise.resolve(); assert.equal(p.sources.length, 1);
  assert.equal(p.reports.filter(r => r.type === 'playing')[0].id, 3);
  p.send({ type: 'stop', id: 4 }); assert.equal(p.sources[0].stopped, true); assert.equal(p.sources[0].onended, null);
  p.send(audio(3)); assert.equal(p.resumes.length, 0);
});
