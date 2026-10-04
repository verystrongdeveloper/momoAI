const { getChat } = require('../services/geminiService');
const { buildGroupSystemPrompt } = require('../config/prompts');
const { groupRooms } = require('../constants/groupRooms');

function makeGroupTurnPrompt(userMessage) {
  if (!userMessage) {
    return '선생이 단톡방에 들어왔다. 멤버 2~4명이 먼저 떠들어라. 출력 형식을 지켜라.';
  }
  return `선생: "${userMessage}"\n위 말에 멤버들이 단톡방처럼 반응하라. 출력 형식을 지켜라.`;
}

exports.sendGroupTrigger = async (req, res) => {
  try {
    const { roomId } = req.body;
    const members = groupRooms[roomId];
    if (!roomId || !members) return res.status(400).json({ error: 'roomId 누락 또는 방 없음' });

    const chat = await getChat('groupChat_' + roomId, undefined, '', buildGroupSystemPrompt(members));
    const result = await chat.sendMessage(makeGroupTurnPrompt(null));
    res.json({ answer: result.response.text() });
  } catch (e) {
    console.error('[sendGroupTrigger]', e);
    res.status(500).json({ error: 'server error', detail: e.message });
  }
};

exports.sendGroupChat = async (req, res) => {
  try {
    const { roomId, userMessage } = req.body;
    const members = groupRooms[roomId];
    if (!roomId || !userMessage || !members) return res.status(400).json({ error: '입력 부족' });

    const chat = await getChat('groupChat_' + roomId, undefined, '', buildGroupSystemPrompt(members));
    const result = await chat.sendMessage(makeGroupTurnPrompt(userMessage));
    const reply = result.response.text();

    console.log(`[sendGroupChat][${roomId}] userMessage: "${userMessage}"\n=> reply: ${reply}`);
    res.json({ answer: reply });
  } catch (e) {
    console.error('[sendGroupChat]', e);
    res.status(500).json({ error: 'server error', detail: e.message });
  }
};
