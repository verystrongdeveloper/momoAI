// src/utils/promptBuilderPro.js
// 짧은 페르소나 + 공통 규칙으로 이벤트 스크립트 프롬프트를 만든다.

const { COMMON_RULES, SENSEI_PROFILE, getPersona, resources } = require('../config/prompts');

/**
 * @typedef {{user:string, ai:string}} DialogPair
 * @param {string} mainChar
 * @param {DialogPair[]} dialogHistory
 * @param {Array<{name: string, emotions: string[]}>} allCharsWithEmotions
 * @param {string} direction
 * @returns {string}
 */
function buildEventPromptPro(mainChar, dialogHistory, allCharsWithEmotions, direction) {
  const historyTXT = dialogHistory
    .map((d, i) => `(${i + 1}) 선생: "${d.user}"\n     ${mainChar}: "${d.ai}"`)
    .join('\n\n');

  const charPromptBlock = allCharsWithEmotions
    .map((charInfo) => {
      const emotions = charInfo.emotions || [];
      return `[${charInfo.name}]\n${getPersona(charInfo.name)}\n사용 가능 emotion: ${emotions.join(', ')}`;
    })
    .join('\n\n');

  const bgList = resources.공통.bg.join('\n- ');
  const musicList = resources.공통.music.join('\n- ');
  const sndList = (resources.공통.sound || []).join('\n- ');
  const expList = resources.공통.expression.join('\n- ');

  return `
모바일 게임 <블루 아카이브>의 인연 스토리를 선생 1인칭으로 작성한다.

${SENSEI_PROFILE}

${COMMON_RULES}

메인 캐릭터: '${mainChar}'
등장 인물: ${allCharsWithEmotions.map((c) => c.name).join(', ')}
등장 인물은 위 목록에만 있어야 한다. NPC(로봇·시민동물 등)를 쓸 때는 캐릭터명에 역할을 적는다. (예: 레스토랑 주인)

[스토리 전개 방향]
${direction}

[캐릭터]
${charPromptBlock}

[최근 대화]
${historyTXT}

[작성 규칙]
1. 위 대화와 전개 방향을 이어서 쓴다. 선택지는 어떤 것을 골라도 자연스럽게 이어지게 한다.
2. 선생 대사는 대사창에 넣지 말고 selection 태그만 쓴다.
3. 말투·호칭·반말/존댓말은 페르소나를 지킨다. 히나와 호시노는 누구에게나 반말. 선생은 나레이션에서도 이름을 선배/님 없이 부른다.
4. 일반 대사·나레이션·선택지를 포함해 약 300줄 내외.
5. 장면이 끝나면 deleteAll로 배경·캐릭터·음악을 전부 지운다. 그 다음 검은 화면에, 이번 이야기에서 실제로 있었던 일을 선생이 나중에 돌아보는 나레이션 한 줄만 넣고 바로 endEvent. 누구와 무엇을 했는지, 어떤 기분이 남았는지를 그 이야기에 맞게 쓴다. 이야기마다 문장이 달라야 하고, 어떤 이야기에도 붙일 수 있는 맺음말은 쓰지 않는다. 지금 장면의 지문이 아니다. 과거형 한 문장이고, 괄호·bg·대사·emotion·music은 넣지 않는다. 어감만 참고할 뿐 그대로 쓰거나 비슷하게 베끼지 않는다. "호시노와 즐거운 하루를 보냈다." "해명하는데 애 먹었다."
6. 나레이션은 선생 1인칭이거나 효과음이다. 항상 "narration :"으로 시작한다.
7. 배경은 메인 캐릭터 소속에 맞춘다. 새 인물이 나와도 같은 배경을 다시 지정하지 않는다.
8. 대사에 괄호 행동 지문을 넣지 않는다.
9. emotion은 그 대사를 한 캐릭터의 PNG만 쓴다. 파일명은 목록의 철자·확장자 그대로. 없는 파일명 금지.
10. 이벤트 시작 시 bg와 music을 반드시 하나 지정한다. music : none 으로 끌 수 있다.

[출력 형식]
타이틀 : 이벤트 제목
캐릭터명(소속) : 대사 [emotion : xx.png, bg : xx.jpg, sound : SE_xx.mp3, music : xx.mp3, expression : xx.png, animation : shakeX]
narration : (내용) [bg : xx.jpg, music : xx.mp3]
selection : (1)"선택지 A" (2)"선택지 B"
deleteEmotion
deleteAll
waitSecond = 숫자
endEvent
- 캐릭터명은 짧은 이름만 (소라사키 히나 X → 히나).
- emotion/bg/sound/music/expression/animation은 반드시 [ ] 안에 넣고, 대사 본문에는 쓰지 않는다.
- selection은 반드시 selection으로 적는다.

[형식 예시]
타이틀 : 잠자는 고래
호시노(대책위원회) : 그러니까 고래는 잘 때도 숨을 참고 있다는 얘기잖아. [emotion : hoshino_bigLaugh.png, sound : SE_Confirm_01.mp3, bg : BG_AbydosCouncilRoom.jpg, music : walkthrough.mp3]
selection : (1)"갑자기 웬 고래 얘기?" (2)"도움이 필요하다는 건 뭐야?"
호시노(대책위원회) : 아아. 낭만이 없구만, 선생도. [emotion : hoshino_dontknowAnything.png]
호시노(대책위원회) : 힘쓰는 일이 필요해서 말이지. [emotion : hoshino_serious.png]
deleteAll
waitSecond = 2
narration : (낡은 창고 문을 열었다.) [bg : BG_AbydosResidence.jpg]
호시노(대책위원회) : 자, 여기야. [emotion : hoshino_yawn2.png]
selection : (1)"여기는?" (2)"창고?"
호시노(대책위원회) : 응. 아무도 안 오는 낮잠 스팟이지. [emotion : hoshino_weakLaugh.png]
narration : (호시노는 순식간에 잠들었다.) [music : morose_dreamer.mp3]
deleteAll
narration : 결국 호시노의 낮잠 자리를 봐 주고 말았다.
endEvent

[사용 가능 bg]
- ${bgList}

[사용 가능 sound]
- ${sndList}

[사용 가능 music]
- ${musicList}

[사용 가능 expression]
- ${expList}
`;
}

module.exports = { buildEventPromptPro };
