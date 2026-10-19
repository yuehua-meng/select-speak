const { test } = require('node:test');
const assert = require('node:assert/strict');
const { speechChunks, AudioCache, kokoroSpeed, kokoroVoice } = require('../dist/speech-core');
test('long paragraphs retain every word across chunk boundaries', () => {
  const text = 'Curiosity opens the door to learning. '.repeat(180) + 'The final words must be spoken.';
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 1);
  assert.deepEqual(chunks.join(' ').split(/\s+/), text.trim().split(/\s+/));
  assert.ok(chunks.every(chunk => chunk.length <= 240));
});
test('bounded audio cache evicts least-recently-used clips and keeps exact samples', () => {
  const cache = new AudioCache(24);
  const a = new Float32Array([0.1, 0.2, 0.3]);
  cache.set('a', a); cache.set('b', new Float32Array(3)); cache.get('a');
  cache.set('c', new Float32Array(3));
  assert.equal(cache.get('b'), undefined); assert.equal(cache.get('a'), a);
  assert.equal(cache.sizeBytes, 24);
  cache.set('oversized', new Float32Array(10)); assert.equal(cache.sizeBytes, 24);
});
test('Windows voice settings migrate to Kokoro and speed maps to a safe range', () => {
  assert.equal(kokoroVoice('Microsoft Zira Desktop'), 'af_heart');
  assert.equal(kokoroVoice('bf_emma'), 'bf_emma');
  assert.equal(kokoroSpeed(-5), 0.6); assert.equal(kokoroSpeed(0), 1); assert.equal(kokoroSpeed(5), 1.4);
});
