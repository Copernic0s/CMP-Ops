import { spawn } from 'node:child_process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const DEFAULT_CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const DEFAULT_CHROME_USER_DATA_DIR =
  'C:/Users/AndresMendez/AppData/Local/Google/Chrome/User Data';
export const DEFAULT_CHROME_PROFILE_DIR = 'Profile 8';
export const DEFAULT_CHROME_DEBUG_PORT = 9222;

const execPowerShell = async (script) => {
  const { execFile } = await import('node:child_process');
  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(String(stdout || '').trim());
      }
    );
  });
};

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
  startupUrl: String(env.HERMES_CMP_URL || 'about:blank').trim(),
  forceRestart: String(env.HERMES_CHROME_FORCE_RESTART || '').trim().toLowerCase() === 'true'
});

const findChromeProcessesForProfile = async (settings) => {
  const userDataDir = String(settings.userDataDir || '').replace(/\\/g, '\\\\');
  const profileDir = String(settings.profileDir || '').replace(/\\/g, '\\\\');
  const script = `
    Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
      Where-Object {
        ($_.CommandLine -and $_.CommandLine -like "*${userDataDir}*") -and
        ($_.CommandLine -like "*${profileDir}*")
      } |
      Select-Object ProcessId, CommandLine |
      ConvertTo-Json -Compress
  `;
  const output = await execPowerShell(script).catch(() => '');
  if (!output) return [];
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

export const ensureChromeDebugger = async (settings = resolveChromeSettings()) => {
  if (await probeDebugger(settings.debugPort)) {
    return { started: false, port: settings.debugPort };
  }

  const matchingProcesses = await findChromeProcessesForProfile(settings).catch(() => []);
  if (matchingProcesses.length > 0 && !settings.forceRestart) {
    throw new Error(
      `Chrome is already running for ${settings.profileDir} without remote debugging. Close that profile or set HERMES_CHROME_FORCE_RESTART=true to let Hermes restart it with port ${settings.debugPort}.`
    );
  }

  if (matchingProcesses.length > 0 && settings.forceRestart) {
    for (const proc of matchingProcesses) {
      const pid = Number(proc.ProcessId || proc.processId);
      if (!Number.isFinite(pid) || pid <= 0) continue;
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        detached: false,
        stdio: 'ignore',
        windowsHide: true
      }).unref?.();
    }
    await sleep(1500);
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

  throw new Error(
    `Chrome debugger did not become ready on port ${settings.debugPort}. If Chrome was already open on ${settings.profileDir}, close it first or set HERMES_CHROME_FORCE_RESTART=true.`
  );
};
