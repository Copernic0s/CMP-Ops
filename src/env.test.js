import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadLocalEnvFile } from './env.js';

test('loadLocalEnvFile loads variables from a local .env file without overriding existing values', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hermes-env-'));
  const envPath = join(dir, '.env');
  writeFileSync(
    envPath,
    [
      'HERMES_SUPABASE_URL=https://example.supabase.co',
      'HERMES_SUPABASE_SECRET_KEY="secret-key"',
      'HERMES_SHOULD_NOT_OVERRIDE=from-file'
    ].join('\n'),
    'utf8'
  );

  process.env.HERMES_SUPABASE_URL = 'https://existing.example.supabase.co';
  delete process.env.HERMES_SUPABASE_SECRET_KEY;
  delete process.env.HERMES_SHOULD_NOT_OVERRIDE;

  const result = loadLocalEnvFile(dir);

  assert.equal(result.loaded, true);
  assert.equal(process.env.HERMES_SUPABASE_URL, 'https://existing.example.supabase.co');
  assert.equal(process.env.HERMES_SUPABASE_SECRET_KEY, 'secret-key');
  assert.equal(process.env.HERMES_SHOULD_NOT_OVERRIDE, 'from-file');
  assert.ok(result.loadedCount >= 2);

  delete process.env.HERMES_SUPABASE_URL;
  delete process.env.HERMES_SUPABASE_SECRET_KEY;
  delete process.env.HERMES_SHOULD_NOT_OVERRIDE;
});
