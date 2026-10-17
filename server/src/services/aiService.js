const crypto = require('node:crypto');
const gemini = require('./geminiService');
const openAiCompatible = require('./openAiCompatibleService');

function configId(config) {
  return crypto.createHash('sha256')
    .update([config.provider, config.apiKey, config.baseUrl || '', config.model || ''].join('\0'))
    .digest('hex')
    .slice(0, 16);
}

function getChat(character, modelName, sessionKey = '', systemInstruction, config) {
  if (config.provider === 'openai-compatible') {
    return openAiCompatible.getChat(character, sessionKey, systemInstruction, config);
  }
  return gemini.getChat(character, modelName, sessionKey, systemInstruction, config.apiKey);
}

module.exports = { getChat, configId };
