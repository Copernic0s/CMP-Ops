import { spawn } from 'node:child_process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const DEFAULT_CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const DEFAULT_CHROME_USER_DATA_DIR =
  'C:/Users/AndresMendez/AppData/Local/Google/Chrome/User Data';
export const DEFAULT_CHROME_PROFILE_DIR = 'Profile 8';
export const DEFAULT_CHROME_DEBUG_PORT = 9222;

const probeDebugger = async (port) => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`);
    return response.ok;
  } catch {
    return false;
  }
};

export const resolveChromeSettings = (env = process.env) => ({
  chromePath: String(env.HERMES_CHROME_PATH || DEFAULT_CHROME_PATH).trim(),
  userDataDir: String(env.HERMES_CHROME_USER_DATA_DIR || DEFAULT_CHROME_USER_DATA_DIR).trim(),
  profileDir: String(env.HERMES_CHROME_PROFILE_DIR || DEFAULT_CHROME_PROFILE_DIR).trim(),
  debugPort: Number(env.HERMES_CHROME_DEBUG_PORT || DEFAULT_CHROME_DEBUG_PORT),
  startupUrl: String(env.HERMES_CMP_URL || 'about:blank').trim()
});

export const ensureChromeDebugger = async (settings = resolveChromeSettings()) => {
  if (await probeDebugger(settings.debugPort)) {
    return { started: false, port: settings.debugPort };
  }

  if (!settings.chromePath) {
    throw new Error('HERMES_CHROME_PATH is required to launch the CMP browser profile');
  }

  const chromeArgs = [
    `--remote-debugging-port=${settings.debugPort}`,
    `--user-data-dir=${settings.userDataDir}`,
    `--profile-directory=${settings.profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    settings.startupUrl
  ];

  spawn(settings.chromePath, chromeArgs, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  }).unref();

  for (let i = 0; i < 30; i += 1) {
    if (await probeDebugger(settings.debugPort)) {
      return { started: true, port: settings.debugPort };
    }
    await sleep(1000);
  }

  throw new Error(`Chrome debugger did not become ready on port ${settings.debugPort}`);
};
