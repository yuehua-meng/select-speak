const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { preferences, clampPosition, hitsImage, dragMoved } = require('../dist/companion-core');
const mask = JSON.parse(fs.readFileSync('src/ui/assets/blue-companion-mask.json', 'utf8'));
test('companion transparency lets empty corners through while fur remains clickable', () => {
  assert.equal(hitsImage({x: 2, y: 2}, mask), false);
  assert.equal(hitsImage({x: 30, y: 54}, mask), false);
  assert.equal(hitsImage({x: 150, y: 180}, mask), true);
  assert.equal(hitsImage({x: 150, y: 260}, mask), true);
});
test('companion positions fit monitors with negative coordinates and changed resolution', () => {
  const work = {x: -1920, y: -200, width: 1920, height: 1040};
  assert.deepEqual(clampPosition({x: 9000, y: -4000}, {width: 280, height: 318}, work), {x: -280, y: -200});
  assert.deepEqual(clampPosition({x: -1800, y: 0}, {width: 280, height: 318}, work), {x: -1800, y: 0});
  assert.deepEqual(clampPosition({x: 2, y: 2}, {width: 280, height: 318}, {x: 0, y: 0, width: 200, height: 200}), {x: 0, y: 0});
});
test('persisted companion settings are bounded, movement threshold rejects hand jitter', () => {
  const p = preferences({scale: 500, position: {x: Infinity, y: 4}});
  assert.equal(p.scale, 1); assert.equal(p.position, undefined); assert.equal(p.visible, true);
  assert.equal(preferences({scale: .75, visible: false, locked: true}).locked, true);
  assert.equal(dragMoved({x: 0, y: 0}, {x: 3, y: 4}), false);
  assert.equal(dragMoved({x: 0, y: 0}, {x: 6, y: 0}), true);
});
