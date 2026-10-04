const fs = require('fs');
const fg = require('fast-glob');

(async () => {
  const files = await fg(['src/**/*.js', 'server.js']);

  let output = `# 📦 프로젝트 파일 구조 및 코드 문서\n\n`;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    output += `## 📄 \`${file}\`\n\n`;
    output += '```js\n' + code + '\n```\n\n';
  }

  fs.writeFileSync('PROJECT_CODE_DOCS.md', output, 'utf8');
  console.log('✅ PROJECT_CODE_DOCS.md 생성 완료');
})();
