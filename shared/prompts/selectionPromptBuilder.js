const { getAvailableCharacters } = require('./characterList');

/**
 * @typedef {{user:string, ai:string}} DialogPair
 * @param  {DialogPair[]} dialogHistory
 * @returns {string}
 */
function buildSelectionPrompt(dialogHistory) {
  const charList = getAvailableCharacters();

  const historyTXT = dialogHistory
    .map((d, i) => `(${i + 1}) 선생: "${d.user}"\n    캐릭터: "${d.ai}"`)
    .join('\n');

  return `역할극 금지. JSON 외 텍스트 금지.

[등장 인물 선정]
아래는 선생과 메인 캐릭터의 최근 3쌍 대화입니다.
${historyTXT}

이벤트에 등장할 추가 인물은 최대 2명. 대화에 명확한 근거가 있는 인물만 고른다.
같은 소속이라는 이유만으로 넣지 않는다. 초점은 메인 캐릭터다.
추가 인물이 없으면 characters는 빈 배열.

등장 가능: ${charList.join(', ')}
이 목록에 없는 이름은 고르지 않는다.

출력 예시:
{"characters":[{"name":"시로코"}],"reason":"대화에서 언급됨","direction":"시놉시스 3~4문장"}
`;
}

module.exports = { buildSelectionPrompt };
