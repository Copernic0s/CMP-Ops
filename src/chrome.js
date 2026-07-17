import { spawn } from 'node:child_process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const DEFAULT_CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const DEFAULT_CHROME_USER_DATA_DIR =
  'C:/Users/AndresMendez/AppData/Local/Google/Chrome/User Data';
export const DEFAULT_CHROME_BROWSER_USER_DATA_DIR =
  'C:/Users/AndresMendez/AppData/Local/Google/Chrome/User Data Hermes';
export const DEFAULT_CHROME_PROFILE_DIR = 'Profile 8';
export const DEFAULT_CHROME_BROWSER_PROFILE_DIR = 'Default';
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

const quoteForPowerShellLike = (value) =>
  String(value || '')
    .replace(/'/g, "''")
    .replace(/\*/g, '`*')
    .replace(/\?/g, '`?');

const probeDebugger = async (port) => {
  for (const host of ['127.0.0.1', 'localhost']) {
    try {
      const response = await fetch(`http://${host}:${port}/json/version`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Try the next host.
    }
  }

  return false;
};

export const resolveChromeSettings = (env = process.env) => ({
  chromePath: String(env.HERMES_CHROME_PATH || DEFAULT_CHROME_PATH).trim(),
  userDataDir: String(env.HERMES_CHROME_USER_DATA_DIR || DEFAULT_CHROME_USER_DATA_DIR).trim(),
  browserUserDataDir: String(env.HERMES_CHROME_BROWSER_USER_DATA_DIR || DEFAULT_CHROME_BROWSER_USER_DATA_DIR).trim(),
  profileDir: String(env.HERMES_CHROME_PROFILE_DIR || DEFAULT_CHROME_PROFILE_DIR).trim(),
  browserProfileDir: String(env.HERMES_CHROME_BROWSER_PROFILE_DIR || DEFAULT_CHROME_BROWSER_PROFILE_DIR).trim(),
  debugPort: Number(env.HERMES_CHROME_DEBUG_PORT || DEFAULT_CHROME_DEBUG_PORT),
  startupUrl: String(env.HERMES_CMP_URL || 'about:blank').trim(),
  forceRestart: String(env.HERMES_CHROME_FORCE_RESTART || '').trim().toLowerCase() === 'true'
});

export const stopMatchingChromeProcesses = async (settings) => {
  if (!settings.forceRestart) {
    return;
  }

  const userDataDir = quoteForPowerShellLike(settings.userDataDir);
  const profileDir = quoteForPowerShellLike(settings.profileDir);
  const profileTitle = String(settings.forceRestartWindowTitle || 'Citifuel - Google Chrome').trim();

  const script = `
    $profileTitle = ${JSON.stringify(profileTitle)}
    $userDataDir = '${userDataDir}'
    $profileDir = '${profileDir}'
    Get-Process chrome -ErrorAction SilentlyContinue |
      Where-Object {
        $commandLine = ''
        try {
          $commandLine = (Get-CimInstance Win32_Process -Filter ("ProcessId=" + $_.Id)).CommandLine
        } catch {
          $commandLine = ''
        }
        $commandLine -and $commandLine -like "*$userDataDir*" -and $commandLine -like "*$profileDir*"
      } |
      ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
      }
    Get-Process chrome -ErrorAction SilentlyContinue |
      Where-Object {
        $_.MainWindowTitle -and $_.MainWindowTitle -eq $profileTitle
      } |
      ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
      }
  `;

  await execPowerShell(script).catch(() => {});
  await sleep(5000);
};

export const ensureChromeDebugger = async (settings = resolveChromeSettings()) => {
  await stopMatchingChromeProcesses(settings);

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

  for (let i = 0; i < 240; i += 1) {
    if (await probeDebugger(settings.debugPort)) {
      return { started: true, port: settings.debugPort };
    }
    await sleep(1000);
  }

  throw new Error(
    `Chrome debugger did not become ready on port ${settings.debugPort}. Open the profile manually or verify the profile can launch with remote debugging enabled.`
  );
};
