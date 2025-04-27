// generate_code.js
const fs = require('fs');
const fg = require('fast-glob');

(async () => {
  const files = await fg([
    'components/**/*.tsx',
    'screens/**/*.tsx',
    'utils/**/*.ts',
    'app/**/*.tsx',
  ]);

  let output = `# 📦 프론트엔드 프로젝트 코드 문서\n\n`;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    output += `## 📄 \`${file}\`\n\n`;
    output += '```tsx\n' + code + '\n```\n\n';  // tsx로 표시
  }

  fs.writeFileSync('FRONTEND_CODE_DOCS.md', output, 'utf8');
  console.log('✅ FRONTEND_CODE_DOCS.md 생성 완료');
})();
