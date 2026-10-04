const { getChat } = require('../services/geminiService');
const { prompts } = require('../config/prompts');
const { groupRooms } = require('../constants/groupRooms');

/**
 * group chat 프롬프트 템플릿 생성
 */
function makeGroupPrompt({ roomId, members, userMessage }) {
  const promptBlock = members
    .map(name => `[${name}]\n${prompts[name] || `${name}처럼 말해.`}`)
    .join('\n\n');

  if (!userMessage) {
    // 트리거용(입장 or 랜덤 발화)
    return `
여기는 <블루 아카이브> 세계관의 단톡방입니다.
참여자들은 실제 찐친들처럼 서로를 아무렇지 않게 놀리고, 드립치고, 갑자기 티키타카하며, 급발진하거나 헛소리를 하기도 합니다.

💬 대화 스타일:
- 반드시 캐릭터들이 랜덤하게 등장하며 말하세요.
- 2~4명만 말해도 됩니다. 같은 캐릭터가 여러 번 연속해서 말해도 됩니다. (권장사항입니다. 이래야지 자연스러움)
- 실제 친구 단톡방처럼 누군가를 놀리거나 몰이하고, 별것도 아닌 걸로 갑자기 싸우거나 화해하기, 갑자기 분위기 전환, 갑자기 리액션 폭주 등 **진짜 고삐 풀린 단톡방** 느낌을 내야 합니다.
- 공부, 동아리, 연애, 성적, 게임, 먹는 얘기, 밈, 갑자기 아무말, 지인 개인기 시키기, 의미없는 논쟁, 과거 부끄러운 썰, 뜬금없는 자기자랑, 신조어·급식체, 유행어, 갑자기 정색 등 **드립과 밈**을 적극 활용하세요.
- 대사는 짧고 단타로, 최대한 찐친스럽게! 서로 놀리거나 리액션을 크게 하세요.
- 농담/구라/뻥/헛소리도 환영!
- **노잼, 설명문, 시스템 메시지, 회의톤 금지**. 절대 평범하게 대화하지 마세요!
- 예시처럼 각 대사 끝에 [second : N], 다음 줄엔 [second : N] 형식으로 간격을 삽입하세요.
- **행동 지문 금지, 지시 괄호, 서술 괄호, 내부 지시 표현 금지 (예를 들어 "(한숨을 쉬면서)피곤하네요." 여기서 (한숨을 쉬면서)같은 것을 쓰지 말라는거임)** 진짜 중요함.
- 이모티콘 금지
- 길게 작성하세요. 대화의 시작과 끝이 있도록
- 문장을 나눠서 출력하세요. 찔끔찔끔 출력해서 실제로 현실 사람들이 채팅하듯이 묘사하세요.


📌 출력 예시:
[호시노] : 선생 또 이상한 소리하네~ [second : 2]
[second : 2]
[호시노] : 뭐~ 원래 그런 사람이니깐~ [second : 2]
[second : 2]
[호시노] : 그럴 수 있나~~ [second : 2]
[시로코] : 무슨 소리 했길래? [second : 2]
[second : 1]
[세리카] : 어휴 진짜...! [second : 1]
[second : 2]
[노노미] : 선생님~ 세리카 씨 또 화났어요☆ [second : 2]
[second : 2]
[호시노] : 시로코, 너도 한마디 해봐. 가만히 있지 말고. [second : 2]

🎭 등장 가능한 캐릭터: ${members.join(', ')}

아래는 각 캐릭터의 성격과 말투입니다:
${promptBlock}
`.trim();
  } else {
    // 유저 발화 대응용 프롬프트
    return `
다음은 ${roomId} 단톡방입니다.

사용자(선생)가 다음과 같은 메시지를 보냈습니다:
"${userMessage}"

💬 대화 스타일:
- 반드시 캐릭터들은 실제 친구처럼 **드립, 몰이, 갑작스런 농담, 장난, 의미없는 리액션, 갑자기 정색, 밈, 헛소리, 티키타카**가 섞인 반응을 보여야 함.
- 누가 먼저 말하고, 누가 이어받을지는 랜덤. 같은 캐릭터가 여러 번 연속해서 말해도 됩니다. (권장사항입니다. 이래야지 자연스러움)
- 진짜 단톡방처럼 **누군가를 아무 이유 없이 놀리거나, 갑자기 개인기 시키거나, 갑자기 싸움 붙거나, 의미없는 농담, 말도 안되는 논쟁, 급발진, 갑자기 정색, 갑분싸, 갑분감동** 등 **다채로운 흐름**이 이어져야 함.
- 단답/장문 섞어서, 하지만 항상 찐친 느낌!
- **노잼, 회의톤, 설명문, 시스템 메시지, 평범한 리액션 금지!**
- 아래 형식을 반드시 따라야 합니다:
- **행동 지문 금지, 지시 괄호, 서술 괄호, 내부 지시 표현 금지 (예를 들어 "(한숨을 쉬면서)피곤하네요." 여기서 (한숨을 쉬면서)같은 것을 쓰지 말라는거임)** 진짜 중요함.
- 이모티콘 금지
- 문장을 나눠서 출력하세요. 찔끔찔끔 출력해서 실제로 현실 사람들이 채팅하듯이 묘사하세요.

📌 출력 예시:
[호시노] : 선생 또 이상한 소리하네~ [second : 2]
[second : 2]
[호시노] : 뭐~ 원래 그런 사람이니깐~ [second : 2]
[second : 2]
[호시노] : 그럴 수 있나~~ [second : 2]
[시로코] : 무슨 소리 했길래? [second : 2]
[second : 1]
[세리카] : 어휴 진짜...! [second : 1]
[second : 2]
[노노미] : 선생님~ 세리카 씨 또 화났어요☆ [second : 2]
[second : 2]
[호시노] : 시로코, 너도 한마디 해봐. 가만히 있지 말고. [second : 2]

🎭 등장 가능한 캐릭터: ${members.join(', ')}

${promptBlock}
`.trim();
  }
}


/**
 * 단톡방 트리거(입장/랜덤) 응답
 */
exports.sendGroupTrigger = async (req, res) => {
  try {
    const { roomId } = req.body;
    const members = groupRooms[roomId];
    if (!roomId || !members) return res.status(400).json({ error: 'roomId 누락 또는 방 없음' });

    const fullPrompt = makeGroupPrompt({ roomId, members, userMessage: null });

    const chat = await getChat('groupChat_' + roomId); // 세션 명확화
    const result = await chat.sendMessage(fullPrompt);
    const reply = result.response.text();

    res.json({ answer: reply });
  } catch (e) {
    console.error('[sendGroupTrigger]', e);
    res.status(500).json({ error: 'server error', detail: e.message });
  }
};

/**
 * 유저 발화 → 다자간 단톡 응답
 */
exports.sendGroupChat = async (req, res) => {
  try {
    const { roomId, history = [], userMessage } = req.body;
    const members = groupRooms[roomId];
    if (!roomId || !userMessage || !members) return res.status(400).json({ error: '입력 부족' });

    const fullPrompt = makeGroupPrompt({ roomId, members, userMessage });

    const chat = await getChat('groupChat_' + roomId); // 세션 명확화
    const result = await chat.sendMessage(fullPrompt);
    const reply = result.response.text();

    // 콘솔 출력
    console.log(`[sendGroupChat][${roomId}] userMessage: "${userMessage}"\n=> reply: ${reply}`);

    res.json({ answer: reply });
  } catch (e) {
    console.error('[sendGroupChat]', e);
    res.status(500).json({ error: 'server error', detail: e.message });
  }
};
