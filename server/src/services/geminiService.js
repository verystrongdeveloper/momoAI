// src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prompts } = require('../config/prompts');

// 앞 모델이 503/429면 다음 모델로 넘긴다.
const MODEL_FALLBACKS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
];

const GEMINI_MODEL = MODEL_FALLBACKS[0];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sessions = new Map();
let activeModel = GEMINI_MODEL;

function isOverloaded(err) {
  return err?.status === 503 || err?.status === 429;
}

function orderFrom(modelName) {
  const index = MODEL_FALLBACKS.indexOf(modelName);
  if (index === -1) return [modelName, ...MODEL_FALLBACKS];
  return MODEL_FALLBACKS.slice(index).concat(MODEL_FALLBACKS.slice(0, index));
}

function openChat(character, modelName, sessionKey, systemInstruction) {
  const cacheKey = [character, modelName, sessionKey].filter(Boolean).join(':');
  if (sessions.has(cacheKey)) return sessions.get(cacheKey);

  console.log(`[Cache MISS] Creating new session for ${cacheKey}`);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || prompts[character] || `${character}처럼 말해.`,
  });
  const chat = model.startChat({ history: [] });
  sessions.set(cacheKey, chat);
  return chat;
}

async function sendWithFallback(character, sessionKey, message, systemInstruction) {
  const order = orderFrom(activeModel);
  let lastError;

  for (const modelName of order) {
    try {
      const chat = openChat(character, modelName, sessionKey, systemInstruction);
      const result = await chat.sendMessage(message);
      if (activeModel !== modelName) {
        console.log(`[MomoStory] 모델 전환: ${activeModel} -> ${modelName}`);
      }
      activeModel = modelName;
      return result;
    } catch (err) {
      lastError = err;
      if (!isOverloaded(err)) throw err;
      console.warn(`[MomoStory] ${modelName} 혼잡(${err.status}), 다음 모델로 시도`);
    }
  }

  throw lastError;
}

/**
 * @param {string} character 캐릭터 이름
 * @param {string} [_modelName] 호환용. 실제 순서는 MODEL_FALLBACKS를 따른다.
 * @param {string} [sessionKey] 같은 캐릭터라도 세션을 나눌 때 사용
 * @param {string} [systemInstruction] 있으면 캐릭터 기본 프롬프트 대신 사용
 */
async function getChat(character, _modelName = GEMINI_MODEL, sessionKey = '', systemInstruction) {
  return {
    sendMessage(message) {
      return sendWithFallback(character, sessionKey, message, systemInstruction);
    },
  };
}

module.exports = { getChat, GEMINI_MODEL };
