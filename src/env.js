import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const stripQuotes = (value) => {
  const trimmed = String(value || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const loadLocalEnvFile = (cwd = process.cwd(), filename = '.env') => {
  const path = resolve(cwd, filename);
  if (!existsSync(path)) {
    return { loaded: false, path };
  }

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  let loadedCount = 0;

  for (const line of lines) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex < 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    const value = stripQuotes(trimmed.slice(equalsIndex + 1));
    process.env[key] = value;
    loadedCount += 1;
  }

  return { loaded: true, path, loadedCount };
};
