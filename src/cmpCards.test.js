import test from 'node:test';
import assert from 'node:assert/strict';

test('cmp cards worker module is loadable', async () => {
  const mod = await import('./cmpCards.js');
  assert.equal(typeof mod.captureCardStatusForCompany, 'function');
});
