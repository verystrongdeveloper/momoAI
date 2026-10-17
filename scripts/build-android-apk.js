const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const androidDir = path.join(root, 'android');
const appBuildDir = process.env.MOMO_ANDROID_BUILD_DIR || path.join(androidDir, 'app', 'build');
const apk = path.join(appBuildDir, 'outputs', 'apk', 'release', 'app-release.apk');
const jdkFallback = 'C:\\Program Files\\Java\\jdk-17';
const sdkFallback = 'E:\\Android\\Sdk';

function javaMajor(home) {
  const java = path.join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!fs.existsSync(java)) return 0;
  const result = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const text = `${result.stdout || ''}\n${result.stderr || ''}`;
  const match = text.match(/version "(?:1\.)?(\d+)/);
  return match ? Number(match[1]) : 0;
}

function resolveJavaHome() {
  const candidates = [process.env.JAVA_HOME, jdkFallback].filter(Boolean);
  for (const home of candidates) {
    if (javaMajor(home) >= 17) return home;
  }
  console.error('APK 빌드에는 JDK 17 이상이 필요합니다.');
  process.exit(1);
}

function resolveSdk() {
  const fromEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  if (fs.existsSync(sdkFallback)) return sdkFallback;
  console.error('Android SDK를 찾지 못했습니다. ANDROID_HOME을 설정하세요.');
  process.exit(1);
}

function desktopDir() {
  let desktop = path.join(os.homedir(), 'Desktop');
  if (process.platform === 'win32') {
    try {
      const out = execFileSync(
        'powershell.exe',
        ['-NoProfile', '-Command', "[Environment]::GetFolderPath('Desktop')"],
        { encoding: 'utf8' },
      ).trim();
      if (out) desktop = out;
    } catch {
      // 기본 Desktop 경로를 사용한다.
    }
  }
  return desktop;
}

const javaHome = resolveJavaHome();
const sdk = resolveSdk();
const localProperties = path.join(androidDir, 'local.properties');
if (!fs.existsSync(localProperties)) {
  const escaped = sdk.replace(/\\/g, '\\\\');
  fs.writeFileSync(localProperties, `sdk.dir=${escaped}\n`);
}

const gradleArgs = ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a', '--no-daemon'];
const build = spawnSync(
  process.platform === 'win32' ? 'cmd.exe' : path.join(androidDir, 'gradlew'),
  process.platform === 'win32' ? ['/d', '/s', '/c', 'gradlew.bat', ...gradleArgs] : gradleArgs,
  {
    cwd: androidDir,
    env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk },
    stdio: 'inherit',
  },
);

if (build.status !== 0) {
  process.exit(build.status || 1);
}

if (!fs.existsSync(apk)) {
  console.error('빌드된 APK가 없습니다:', apk);
  process.exit(1);
}

const dest = path.join(desktopDir(), 'MomoStory.apk');
try {
  fs.copyFileSync(apk, dest);
} catch (err) {
  console.error('바탕화면에 복사하지 못했습니다. 폰에 설치 중이면 연결을 끊고 다시 실행하세요.');
  console.error(err.message);
  process.exit(1);
}

console.log(dest);
