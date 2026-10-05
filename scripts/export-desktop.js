const { spawn } = require('child_process');

const child = spawn('npx', ['expo', 'export', '--platform', 'web'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_GEMINI_TRANSPORT: 'direct' },
});

child.on('exit', (code) => process.exit(code ?? 1));
