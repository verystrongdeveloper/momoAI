// server.js
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`✅ Gemini 서버 실행 중: http://localhost:${PORT}`),
);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`✅ 백엔드가 이미 실행 중입니다: http://localhost:${PORT}`);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
