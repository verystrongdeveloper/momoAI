import { getApiKey, getRememberApiKey as readRemember, saveApiKey, subscribeStorage } from '@/storage';

/** 이번 실행에서 쓰는 Gemini 키. 없으면 빈 문자열. */
export function getGeminiKey(): string {
  return getApiKey();
}

export function getRememberApiKey(): boolean {
  return readRemember();
}

export function setGeminiKey(key: string, remember = readRemember()) {
  saveApiKey(key, remember);
}

export function subscribeGeminiKey(listener: () => void) {
  return subscribeStorage(listener);
}
