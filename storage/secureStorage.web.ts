import { WEB_API_KEY, WEB_OPENAI_API_KEY } from './types';

function browserStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export async function loadApiKey(): Promise<string> {
  try {
    return browserStorage()?.getItem(WEB_API_KEY) ?? '';
  } catch {
    return '';
  }
}

export async function saveApiKey(value: string): Promise<void> {
  browserStorage()?.setItem(WEB_API_KEY, value);
}

export async function clearApiKey(): Promise<void> {
  try {
    browserStorage()?.removeItem(WEB_API_KEY);
  } catch {
    // 저장을 막아 둔 브라우저에서는 메모리만 유지한다.
  }
}

export async function loadOpenAiApiKey(): Promise<string> {
  try {
    return browserStorage()?.getItem(WEB_OPENAI_API_KEY) ?? '';
  } catch {
    return '';
  }
}

export async function saveOpenAiApiKey(value: string): Promise<void> {
  browserStorage()?.setItem(WEB_OPENAI_API_KEY, value);
}

export async function clearOpenAiApiKey(): Promise<void> {
  try {
    browserStorage()?.removeItem(WEB_OPENAI_API_KEY);
  } catch {
    // 저장을 막아 둔 브라우저에서는 메모리만 유지한다.
  }
}
