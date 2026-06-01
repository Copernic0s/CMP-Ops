import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveChromeSettings } from './chrome.js';

test('resolveChromeSettings picks up profile defaults', () => {
  const settings = resolveChromeSettings({});
  assert.equal(settings.profileDir, 'Profile 8');
  assert.equal(settings.debugPort, 9222);
});
