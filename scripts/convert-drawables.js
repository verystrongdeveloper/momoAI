const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.argv[2];
if (!root) {
  console.error('missing dir');
  process.exit(1);
}

function kind(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return 'other';
}

async function walk(dir) {
  let converted = 0;
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) {
      converted += await walk(file);
      continue;
    }
    const ext = path.extname(name).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') continue;
    const buf = fs.readFileSync(file);
    if (kind(buf) !== 'webp') continue;
    const image = sharp(buf, { animated: false });
    const meta = await image.metadata();
    // JPEG는 투명 배경을 검은색으로 채운다. 알파가 있으면 확장자와 상관없이 PNG로 둔다.
    if (meta.hasAlpha || ext === '.png') {
      const pngPath = file.replace(/\.(png|jpe?g)$/i, '.png');
      fs.writeFileSync(pngPath, await image.ensureAlpha().png().toBuffer());
      if (pngPath !== file) fs.unlinkSync(file);
    } else {
      fs.writeFileSync(file, await image.jpeg({ quality: 90 }).toBuffer());
    }
    converted += 1;
  }
  return converted;
}

walk(root)
  .then((converted) => {
    console.log('converted ' + converted);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
