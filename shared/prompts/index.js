// src/config/prompts/index.js
// 공통 규칙 + 짧은 페르소나로 채팅/단톡/이벤트 프롬프트를 조립한다.

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

function buildGroupSystemPrompt(members) {
  const block = members.map((name) => `[${name}]\n${getPersona(name)}`).join('\n\n');
  return `${COMMON_RULES}

여기는 <블루 아카이브> 단톡방이다. 참여자들은 찐친처럼 드립·몰이·티키타카로 대화한다.
- 2~4명이 말하고, 같은 캐릭터가 연속으로 말해도 된다.
- 대사는 짧고 단타. 행동 지문·이모티콘·시스템 메시지 금지.
- 길게 이어지되 문장은 찔끔찔끔 나눠 출력한다.

출력 형식:
[이름] : 대사 [second : N]
[second : N]
- N은 1 이상 10 이하의 정수. 채팅 간격은 10초를 넘기지 않는다.

등장 가능: ${members.join(', ')}

${block}`;
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
  buildGroupSystemPrompt,
};
