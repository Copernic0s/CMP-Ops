import test from 'node:test';
import assert from 'node:assert/strict';

test('cmp inventory worker module is loadable', async () => {
  const mod = await import('./cmpInventory.js');
  assert.equal(typeof mod.captureCardInventory, 'function');
});
