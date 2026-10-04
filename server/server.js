// server.js
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Gemini 서버 실행 중: http://localhost:${PORT}`),
);
