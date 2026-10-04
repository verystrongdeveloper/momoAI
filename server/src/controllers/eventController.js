// src/controllers/eventController.js
const { getChat, GEMINI_MODEL } = require('../services/geminiService');
const { buildSelectionPrompt } = require('../utils/selectionPromptBuilder');
const { buildEventPromptPro } = require('../utils/promptBuilderPro');
const { getDialogHistory } = require('./chatController');
const { resources } = require('../config/prompts');

exports.createEvent = async (req, res) => {
  const { character } = req.body;
  if (!character) {
    return res.status(400).json({ error: 'character 누락' });
  }

  // 최근 3쌍 대화 확보
  const dialogHistory = getDialogHistory(character);
  if (dialogHistory.length !== 3) {
    return res.status(400).json({ error: 'dialogHistory 부족(3쌍 필요)' });
  }

  try {
    /* 1) 등장 인물 선정 */
    const selector = await getChat(character, GEMINI_MODEL);
    const selPrompt = buildSelectionPrompt(dialogHistory);
    console.log('🧠 [등장 인물 선정 프롬프트]');
    console.log(selPrompt);
    const selRes = await selector.sendMessage(selPrompt);

    // ── JSON 파싱 ────────────────────────────────────────────────────────
    // flash 모델이 ```json … ``` 로 감싸도 중괄호 블록만 추출
    const rawSelText = typeof selRes.response.text === 'function'
      ? await selRes.response.text()
      : selRes.response.text;

    console.log(`📦 [${GEMINI_MODEL} 응답]`);
    console.log(rawSelText);
    const jsonMatch = rawSelText.match(/\{[\s\S]*}/);
    if (!jsonMatch) {
      return res.status(500).json({
        error: 'flash 모델 응답이 JSON 형식이 아님',
        raw: rawSelText,
      });
    }
    const selection = JSON.parse(jsonMatch[0]);
    console.log('📦 [추출된 JSON]');
    console.log(selection);

    // ★ 변경된 부분: Flash 모델 응답에서 캐릭터 이름만 가져오고, emotions는 resources에서 조회
    const selectedExtraChars = selection.characters || []; // [{ name: "이름" }] 형식
    const allCharsWithEmotions = [];

    // 메인 캐릭터 추가
    allCharsWithEmotions.push({
      name: character,
      emotions: resources[character]?.emotions || []
    });

    // 선택된 추가 캐릭터들을 순회하며 emotions 정보 추가
    selectedExtraChars.forEach(selectedChar => {
      // 메인 캐릭터와 중복되지 않도록 방지
      if (selectedChar.name !== character) {
        allCharsWithEmotions.push({
          name: selectedChar.name,
          emotions: resources[selectedChar.name]?.emotions || []
        });
      }
    });

    console.log('✨ [Pro 모델로 전달될 캐릭터 및 이모션 목록]');
    console.log(JSON.stringify(allCharsWithEmotions, null, 2));

    /* 2) 이벤트 스크립트 생성. 채팅 세션과 섞이지 않도록 세션을 분리한다. */
    const proChat = await getChat(character, GEMINI_MODEL, 'event');
    // ★ 변경: Pro 모델에게는 이제 '모든' 캐릭터(메인 + 추가)와 그들의 감정 리스트를 함께 넘겨줍니다.
    const eventPrompt = buildEventPromptPro(
      character,
      dialogHistory,
      allCharsWithEmotions, // ⬅️ 변경된 인자
      selection.direction,
    );
    const eventRes = await proChat.sendMessage(eventPrompt);

    // pro 응답 본문
    const rawScript = typeof eventRes.response.text === 'function'
      ? await eventRes.response.text()
      : eventRes.response.text;
    const script = rawScript.trim();

    if (!script.includes('endEvent')) {
      console.warn(`[${character}] 이벤트 스크립트 형식 경고`);
    }

    return res.json({ eventScript: script, selection });
  } catch (err) {
    console.error(`[이벤트 생성 오류 - ${character}]`, err);
    return res.status(500).json({ error: '이벤트 생성 실패', detail: err.message });
  }
};
