const crypto = require('node:crypto');
const dns = require('node:dns');
const https = require('node:https');
const net = require('node:net');
const axios = require('axios');
const { prompts } = require('../config/prompts');

const sessions = new Map();

function publicIpv4(address) {
  if (net.isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function publicIpv4Lookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.lookup(hostname, { all: true, verbatim: true }, (error, records) => {
    if (error) return callback(error);
    const addresses = records.filter(({ address }) => publicIpv4(address));
    if (!addresses.length) return callback(new Error('Base URL은 공개 IPv4 주소로 연결되어야 합니다.'));
    if (options?.all) return callback(null, addresses);
    return callback(null, addresses[0].address, 4);
  });
}

// shortcut: Express proxy supports public IPv4 targets; use direct transport for local or IPv6-only endpoints.
// Pin requests to public addresses and reject redirects to prevent SSRF.
const httpsAgent = new https.Agent({ keepAlive: true, lookup: publicIpv4Lookup });

function endpointFor(baseUrl) {
  if (typeof baseUrl !== 'string' || baseUrl.trim().length > 2048) {
    throw new Error('OpenAI Compatible Base URL 형식이 올바르지 않습니다.');
  }
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('OpenAI Compatible Base URL 형식이 올바르지 않습니다.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Express 경유 OpenAI Compatible Base URL은 HTTPS 주소여야 합니다.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname) === 6 || (net.isIP(hostname) === 4 && !publicIpv4(hostname))) {
    throw new Error('Express 경유 Base URL은 공개 IPv4 또는 공개 도메인 주소여야 합니다.');
  }
  const path = url.pathname.replace(/\/+$/, '');
  url.pathname = path.endsWith('/chat/completions') ? path : `${path}/chat/completions`;
  return url.toString();
}

function sessionFor(character, sessionKey, config) {
  const id = crypto.createHash('sha256')
    .update([character, sessionKey, config.apiKey, config.baseUrl, config.model].join('\0'))
    .digest('hex');
  if (!sessions.has(id)) sessions.set(id, { history: [] });
  return sessions.get(id);
}

function responseText(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => typeof part?.text === 'string' ? part.text : '').join('').trim();
  }
  return '';
}

function getChat(character, sessionKey = '', systemInstruction, config) {
  const endpoint = endpointFor(config.baseUrl);
  const model = config.model.trim();
  if (!model) throw new Error('OpenAI Compatible 모델 ID를 입력하세요.');
  if (!config.apiKey) throw new Error('OpenAI Compatible API 키를 입력하세요.');
  const session = sessionFor(character, sessionKey, { ...config, model, baseUrl: endpoint });
  const system = systemInstruction || prompts[character] || `${character}처럼 말해.`;

  return {
    async sendMessage(message) {
      let response;
      try {
        response = await axios.post(endpoint, {
          model,
          messages: [{ role: 'system', content: system }, ...session.history, { role: 'user', content: message }],
        }, {
          headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
          httpsAgent,
          maxRedirects: 0,
          proxy: false,
          timeout: 120000,
          validateStatus: () => true,
        });
      } catch (err) {
        throw new Error(`OpenAI Compatible API 요청 실패: ${err.message}`);
      }
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        const detail = typeof data?.error === 'string' ? data.error : data?.error?.message;
        throw new Error(`OpenAI Compatible API 오류: ${detail || `응답 실패 (${response.status})`}`);
      }
      const text = responseText(data?.choices?.[0]?.message?.content);
      if (!text) throw new Error('OpenAI Compatible 응답이 비어 있습니다.');
      session.history.push({ role: 'user', content: message }, { role: 'assistant', content: text });
      return { response: { text: () => text } };
    },
  };
}

module.exports = { getChat, endpointFor };
