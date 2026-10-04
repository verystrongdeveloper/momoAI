// src/utils/characterList.js

const { prompts } = require('../config/prompts');

/**
 * prompts에 정의된 캐릭터 이름만 리스트로 추출
 * @returns {string[]}
 */
function getAvailableCharacters() {
  return Object.keys(prompts).filter((name) => typeof prompts[name] === 'string');
}

module.exports = { getAvailableCharacters };
