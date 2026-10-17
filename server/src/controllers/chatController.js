// src/controllers/chatController.js
const chatLogs = new Map(); // 키+캐릭터별 최근 3쌍
const { getChat, configId } = require('../services/aiService');
const { apiKeyFrom } = require('../services/geminiService');
const { endpointFor } = require('../services/openAiCompatibleService');

function historyKey(character, config) {
  return `${configId(config)}:${character}`;
}

function readKey(req, res) {
  const provider = req.body?.aiProvider ?? 'gemini';
  if (provider === 'openai-compatible') {
    const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';
    const baseUrl = typeof req.body?.baseUrl === 'string' ? req.body.baseUrl.trim() : '';
    const model = typeof req.body?.model === 'string' ? req.body.model.trim() : '';
    if (!apiKey || apiKey.length > 4096 || /[\r\n]/.test(apiKey)) {
      res.status(400).json({ error: 'OpenAI Compatible API 키를 확인하세요' });
      return null;
    }
    if (!baseUrl || !model || model.length > 200) {
      res.status(400).json({ error: 'OpenAI Compatible Base URL 또는 모델 ID를 확인하세요' });
      return null;
    }
    try {
      endpointFor(baseUrl);
    } catch (err) {
      res.status(400).json({ error: err.message });
      return null;
    }
    return { provider, apiKey, baseUrl, model };
  }
  if (provider !== 'gemini') {
    res.status(400).json({ error: 'AI 제공자 설정이 올바르지 않습니다' });
    return null;
  }
  const apiKey = apiKeyFrom(req);
  if (apiKey === null) {
    res.status(400).json({ error: 'Gemini API 키 형식이 올바르지 않습니다' });
    return null;
  }
  if (!apiKey) {
    res.status(400).json({ error: 'Gemini API 키를 입력하세요' });
    return null;
  }
  return { provider, apiKey };
}

/**
 * POST /api/chat
 */
exports.sendChat = async (req, res) => {
  const { character, message } = req.body;
  const config = readKey(req, res);
  if (!config) return;
  if (!character || !message) {
    return res.status(400).json({ error: 'character 또는 message 누락' });
  }

  try {
    const chat   = await getChat(character, undefined, '', undefined, config);
    const result = await chat.sendMessage(message);
    const reply  = result.response.text();

    // 최근 대화 3쌍 관리 ------------------------------
    const slot = historyKey(character, config);
    const log = chatLogs.get(slot) || [];
    log.push({ user: message, ai: reply });
    if (log.length > 3) log.shift();
    chatLogs.set(slot, log);

    const eventReady = log.length >= 3;
    res.json({ reply, eventReady });
  } catch (err) {
    console.error('[AI 오류]', err.message);
    res.status(500).json(config.provider === 'gemini'
      ? { error: 'Gemini 응답 실패' }
      : { error: 'OpenAI Compatible 응답 실패', detail: err.message });
  }
};

/**
 * 대화 로그 3쌍을 조회하는 헬퍼
 * controllers/eventController에서 사용
 */
exports.getDialogHistory = (character, config) => chatLogs.get(historyKey(character, config)) || [];
exports.chatLogs = chatLogs;
exports.historyKey = historyKey;
exports.readKey = readKey;
