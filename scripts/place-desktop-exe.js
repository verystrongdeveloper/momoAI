const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const src = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'momostory.exe');
if (!fs.existsSync(src)) {
  console.error('빌드된 exe가 없습니다:', src);
  process.exit(1);
}

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

const dest = path.join(desktop, 'MomoStory.exe');
try {
  fs.copyFileSync(src, dest);
} catch (err) {
  console.error('바탕화면에 복사하지 못했습니다. MomoStory가 켜져 있으면 종료한 뒤 다시 실행하세요.');
  console.error(err.message);
  process.exit(1);
}

console.log(dest);
