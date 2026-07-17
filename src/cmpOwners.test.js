import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveChromeSettings } from './chrome.js';
import { resolveSupabaseSettings } from './hermesStore.js';
import { resolveOwnersUrl } from './cmpOwners.js';

test('resolveChromeSettings picks up profile defaults', () => {
  const settings = resolveChromeSettings({});
  assert.equal(settings.profileDir, 'Profile 8');
  assert.equal(settings.debugPort, 9222);
});

test('resolveSupabaseSettings reads Hermes-prefixed env first', () => {
  const settings = resolveSupabaseSettings({
    HERMES_SUPABASE_URL: 'https://example.supabase.co',
    HERMES_SUPABASE_SERVICE_ROLE_KEY: 'secret'
  });

  assert.equal(settings.url, 'https://example.supabase.co');
  assert.equal(settings.serviceKey, 'secret');
});

test('resolveOwnersUrl always points to the owners route', () => {
  assert.equal(
    resolveOwnersUrl('https://cmp-front.production.united-fuel.com'),
    'https://cmp-front.production.united-fuel.com/owners'
  );
  assert.equal(
    resolveOwnersUrl('https://cmp-front.production.united-fuel.com/profile'),
    'https://cmp-front.production.united-fuel.com/owners'
  );
});
