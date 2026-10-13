// src/config/prompts/index.js
// 공통 규칙 + 짧은 페르소나로 채팅/이벤트 프롬프트를 조립한다.

const { COMMON_RULES, SENSEI_PROFILE } = require('./common');
const { personas } = require('./personas');
const { npcs } = require('./npcs');
const { resources } = require('./resources');

function getPersona(name) {
  return personas[name] || npcs[name] || `${name}처럼 말해.`;
}

function buildChatPrompt(name) {
  const persona = getPersona(name);
  if (!personas[name] && !npcs[name]) return persona;
  return `${COMMON_RULES}\n\n[페르소나]\n${persona}`;
}

const prompts = {};
for (const name of Object.keys(personas)) {
  prompts[name] = buildChatPrompt(name);
}
for (const name of Object.keys(npcs)) {
  prompts[name] = buildChatPrompt(name);
}

module.exports = {
  prompts,
  resources,
  personas,
  npcs,
  COMMON_RULES,
  SENSEI_PROFILE,
  getPersona,
  buildChatPrompt,
};
