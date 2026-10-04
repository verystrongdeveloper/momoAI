// src/controllers/chatController.js
const chatLogs = new Map(); // 키+캐릭터별 최근 3쌍
const { getChat, apiKeyFrom, keyId } = require('../services/geminiService');

function historyKey(character, apiKey) {
  return `${keyId(apiKey)}:${character}`;
}

function readKey(req, res) {
  const apiKey = apiKeyFrom(req);
  if (apiKey === null) {
    res.status(400).json({ error: 'Gemini API 키 형식이 올바르지 않습니다' });
    return null;
  }
  if (!apiKey) {
    res.status(400).json({ error: 'Gemini API 키를 입력하세요' });
    return null;
  }
  return apiKey;
}

/**
 * POST /api/chat
 */
exports.sendChat = async (req, res) => {
  const { character, message } = req.body;
  const apiKey = readKey(req, res);
  if (!apiKey) return;
  if (!character || !message) {
    return res.status(400).json({ error: 'character 또는 message 누락' });
  }

  try {
    const chat   = await getChat(character, undefined, '', undefined, apiKey);
    const result = await chat.sendMessage(message);
    const reply  = result.response.text();

    // 최근 대화 3쌍 관리 ------------------------------
    const slot = historyKey(character, apiKey);
    const log = chatLogs.get(slot) || [];
    log.push({ user: message, ai: reply });
    if (log.length > 3) log.shift();
    chatLogs.set(slot, log);

    const eventReady = log.length >= 3;
    res.json({ reply, eventReady });
  } catch (err) {
    console.error('[Gemini 오류]', err);
    res.status(500).json({ error: 'Gemini 응답 실패' });
  }
};

/**
 * 대화 로그 3쌍을 조회하는 헬퍼
 * controllers/eventController에서 사용
 */
exports.getDialogHistory = (character, apiKey) => chatLogs.get(historyKey(character, apiKey)) || [];
exports.chatLogs = chatLogs;
exports.historyKey = historyKey;
exports.readKey = readKey;