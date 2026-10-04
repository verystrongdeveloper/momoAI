// src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prompts }            = require('../config/prompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sessions = new Map();

/**
 * @param {string} character 캐릭터 이름
 * @param {string} [modelName='gemini-2.0-flash'] 사용할 모델 이름 (기본값: flash) // ✅ 모델 이름 인자 추가
 * @returns {Promise<import('@google/generative-ai').GenerativeModelChatSession>} // ✅ 반환 타입 수정 (startChat은 ChatSession 반환)
 */
async function getChat(character, modelName = 'gemini-2.0-flash') { // ✅ modelName 인자 받기
  const cacheKey = `${character}-${modelName}`; // ✅ 캐시 키에 모델 이름 포함

  if (sessions.has(cacheKey)) {
    console.log(`[Cache HIT] Using cached session for ${cacheKey}`);
    return sessions.get(cacheKey);
  }
  console.log(`[Cache MISS] Creating new session for ${cacheKey}`);

  // ✅ 전달받은 modelName 사용
  const model = genAI.getGenerativeModel({ model: modelName });

  // ✅ 초기 프롬프트를 history에 포함하여 chat session 시작
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: prompts[character] || `${character}처럼 말해.` }],
      },
      {
        role: 'model',
        // ✅ 모델이 역할을 이해했다는 초기 응답 추가 (Gemini 권장사항)
        parts: [{ text: `네, 알겠습니다. 저는 이제부터 ${character}입니다.` }],
      },
    ],
    // generationConfig는 필요에 따라 추가 (temperature 등)
  });

  sessions.set(cacheKey, chat); // ✅ 수정된 키로 캐시에 저장
  return chat;
}

module.exports = { getChat };