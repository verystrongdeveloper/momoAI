const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// 백엔드 server 폴더만 Expo 번들에서 제외한다.
// /server\/.*/ 는 Windows에서 server\ 로 바뀌며, 폴더명이 server로 끝나는
// fontfaceobserver 까지 같이 막는다.
config.resolver.blockList = exclusionList([/[/\\]server[/\\].*/]);

module.exports = config;
