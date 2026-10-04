const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3000;
const SERVER_CWD = path.join(__dirname, '..', 'server');

function shouldAttachBackend(argv = process.argv) {
  const args = argv.slice(1).join(' ');
  if (/\bjest\b/.test(args) || /\bexport\b/.test(args)) return false;
  return args.includes('expo') && /\bstart\b/.test(args);
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    let settled = false;
    const finish = (used) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(used);
    };
    socket.setTimeout(400);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function attachBackend() {
  if (global.__momoBackendBootstrapped) return;
  if (!shouldAttachBackend()) return;
  global.__momoBackendBootstrapped = true;

  portInUse(PORT).then((used) => {
    if (used) {
      console.log(`[momo] 백엔드가 이미 http://localhost:${PORT} 에서 실행 중입니다.`);
      return;
    }

    const child = spawn(process.execPath, ['server.js'], {
      cwd: SERVER_CWD,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(PORT) },
    });

    child.on('exit', (code) => {
      if (code && code !== 0) {
        console.error(`[momo] 백엔드가 종료되었습니다 (code ${code}).`);
      }
    });
  });
}

attachBackend();

module.exports = { shouldAttachBackend };
