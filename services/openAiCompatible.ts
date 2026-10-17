import { prompts } from '../shared/prompts';
import { dialogKey } from './geminiClient/rest';
import { OPENAI_OFFLINE_MESSAGE, throwIfOffline } from './geminiClient/errors';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };
type Session = { history: Message[] };

const sessions = new Map<string, Session>();

export function openAiEndpoint(baseUrl: string): string {
  if (baseUrl.trim().length > 2048) throw new Error('OpenAI Compatible Base URL이 너무 깁니다.');
  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw new Error('OpenAI Compatible Base URL 형식이 올바르지 않습니다.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const parts = hostname.split('.').map(Number);
  const localIpv4 = parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) && (
    parts[0] === 10 || parts[0] === 127 || (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
  );
  const localHost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || localIpv4;
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && localHost)) || url.username || url.password || url.search || url.hash) {
    throw new Error('OpenAI Compatible Base URL은 HTTPS 주소여야 합니다. 로컬 HTTP 주소는 사용할 수 있습니다.');
  }
  const path = url.pathname.replace(/\/+$/, '');
  url.pathname = path.endsWith('/chat/completions') ? path : `${path}/chat/completions`;
  return url.toString();
}

function sessionFor(character: string, sessionKey: string, apiKey: string, baseUrl: string, model: string): Session {
  const id = dialogKey(`${character}:${sessionKey}`, `${apiKey}\0${baseUrl}\0${model}`);
  const existing = sessions.get(id);
  if (existing) return existing;
  const session = { history: [] };
  sessions.set(id, session);
  return session;
}

function responseText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((part) => part && typeof part === 'object' && 'text' in part && typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim();
  }
  return '';
}

export async function sendOpenAiCompatible(
  character: string,
  sessionKey: string,
  message: string,
  systemInstruction: string | undefined,
  config: { apiKey: string; baseUrl: string; model: string },
): Promise<string> {
  const apiKey = config.apiKey.trim();
  const model = config.model.trim();
  if (!apiKey) throw new Error('OpenAI Compatible API 키를 입력하세요.');
  if (/[\r\n]/.test(apiKey)) throw new Error('OpenAI Compatible API 키 형식이 올바르지 않습니다.');
  if (apiKey.length > 4096) throw new Error('OpenAI Compatible API 키 형식이 올바르지 않습니다.');
  if (!model) throw new Error('OpenAI Compatible 모델 ID를 입력하세요.');
  if (model.length > 200) throw new Error('OpenAI Compatible 모델 ID 형식이 올바르지 않습니다.');
  const endpoint = openAiEndpoint(config.baseUrl);
  throwIfOffline(OPENAI_OFFLINE_MESSAGE);

  const session = sessionFor(character, sessionKey, apiKey, endpoint, model);
  const system = systemInstruction || prompts[character] || `${character}처럼 말해.`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...session.history, { role: 'user', content: message }] }),
    });
  } catch {
    throw new Error(OPENAI_OFFLINE_MESSAGE);
  }

  const raw = await response.text();
  let data: { error?: { message?: string } | string; choices?: { message?: { content?: unknown } }[] } = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    const detail = typeof data.error === 'string' ? data.error : data.error?.message;
    throw new Error(`OpenAI Compatible API 오류: ${detail || `응답 실패 (${response.status})`}`);
  }

  const text = responseText(data.choices?.[0]?.message?.content);
  if (!text) throw new Error('OpenAI Compatible 응답이 비어 있습니다.');
  session.history.push({ role: 'user', content: message }, { role: 'assistant', content: text });
  return text;
}
