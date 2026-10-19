const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectedText, sanitizeSettings, popupPosition } = require('../dist/core');
test('reject empty, non-English and oversized selections without silently truncating', () => {
  assert.equal(selectedText('   ', true), null);
  assert.equal(selectedText('你好世界', true), null);
  assert.equal(selectedText('A'.repeat(12001), true), null);
  assert.equal(selectedText('你好 world', true), '你好 world');
  assert.equal(selectedText('你好世界', false), '你好世界');
  assert.equal(selectedText('  first\r\nsecond\uFFFC  ', true), 'first\nsecond');
});
test('untrusted settings cannot inject commands or out-of-range voice rates', () => {
  const result = sanitizeSettings({ rate: 900, popupSeconds: -2, voice: 42, clipboardApps: ['Acrobat.exe', 'acrobat.exe', 'cmd.exe; bad', '../x.exe'], excludedApps: [] });
  assert.equal(result.rate, 5); assert.equal(result.popupSeconds, 3); assert.equal(result.voice, 'af_heart');
  assert.deepEqual(result.clipboardApps, ['acrobat.exe']);
  assert.equal(sanitizeSettings({ rate: NaN }).rate, 0);
});
test('popup stays inside negative-coordinate and scaled monitor work areas', () => {
  const work = { x: -1920, y: -200, width: 1920, height: 1040 };
  for (const anchor of [{x: -2, y: 835}, {x: -2500, y: -400}, {x: -600, y: 200}]) {
    const result = popupPosition(anchor, work);
    assert.ok(result.x >= work.x && result.x + 108 <= work.x + work.width);
    assert.ok(result.y >= work.y && result.y + 54 <= work.y + work.height);
  }
});
