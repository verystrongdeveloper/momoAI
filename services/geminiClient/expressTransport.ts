import { getAIProvider, getCurrentAIKey, getOpenAiCompatibleConfig } from '@/services/aiSettings';
import { GEMINI_OFFLINE_MESSAGE, OPENAI_OFFLINE_MESSAGE, throwIfOffline } from './errors';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const provider = getAIProvider();
  const offlineMessage = provider === 'openai-compatible' ? OPENAI_OFFLINE_MESSAGE : GEMINI_OFFLINE_MESSAGE;
  throwIfOffline(offlineMessage);
  const apiKey = getCurrentAIKey();
  const config = provider === 'openai-compatible' ? getOpenAiCompatibleConfig() : null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(provider === 'openai-compatible'
        ? { ...body, aiProvider: provider, ...config }
        : apiKey ? { ...body, apiKey } : body),
    });
  } catch {
    throw new Error(offlineMessage);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (provider === 'openai-compatible') {
      let data: { error?: string; detail?: string } | null = null;
      try {
        data = JSON.parse(detail);
      } catch {}
      const message = data?.detail || data?.error || detail || `HTTP ${res.status}`;
      throw new Error(message.startsWith('OpenAI Compatible') ? message : `OpenAI Compatible API 오류: ${message}`);
    }
    throw new Error(`[api] ${path} ${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** 기존 Express /api. 직접 호출이 production web에서 확인되기 전까지 기본 경로다. */
export const expressTransport = {
  trigger: (character: string) =>
    post<{ triggerLine: string }>('/api/trigger', { character }),

  chat: (character: string, message: string) =>
    post<{ reply: string; eventReady: boolean }>('/api/chat', { character, message }),

  createEvent: (character: string) =>
    post<{ eventScript: string }>('/api/event', { character }),
};
