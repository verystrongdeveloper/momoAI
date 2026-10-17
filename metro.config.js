const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// npx expo start / npm start 가 Metro 설정을 읽을 때 백엔드도 같이 띄운다.
require('./scripts/ensure-backend');

const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes('txt')) config.resolver.assetExts.push('txt');
require('./scripts/build-video-renderer');

// 백엔드 server 폴더만 Expo 번들에서 제외한다.
// /server\/.*/ 는 Windows에서 server\ 로 바뀌며, 폴더명이 server로 끝나는
// fontfaceobserver 까지 같이 막는다.
const projectServerPath = path.resolve(__dirname, 'server').replace(/[/\\]/g, '[/\\\\]');
const serverBlock = new RegExp(`^${projectServerPath}[/\\\\].*`);
if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList.push(serverBlock);
} else {
  config.resolver.blockList = serverBlock;
}

module.exports = config;
