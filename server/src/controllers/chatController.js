// src/controllers/chatController.js
const chatLogs        = new Map();            // 캐릭터별 최근 3쌍 저장
const { getChat }     = require('../services/geminiService');

/**
 * POST /api/chat
 */
exports.sendChat = async (req, res) => {
  const { character, message } = req.body;
  if (!character || !message) {
    return res.status(400).json({ error: 'character 또는 message 누락' });
  }

  try {
    const chat   = await getChat(character);
    const result = await chat.sendMessage(message);
    const reply  = result.response.text();

    // 최근 대화 3쌍 관리 ------------------------------
    const log = chatLogs.get(character) || [];
    log.push({ user: message, ai: reply });
    if (log.length > 3) log.shift();
    chatLogs.set(character, log);

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
exports.getDialogHistory = (character) => chatLogs.get(character) || [];
exports.chatLogs = chatLogs;