const STORAGE_KEY = 'momo.geminiApiKey';

let memory = '';

function readStored(): string {
  if (typeof localStorage === 'undefined') return memory;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return memory;
  }
}

/** 이 브라우저에 저장해 둔 Gemini 키. 없으면 빈 문자열. */
export function getGeminiKey(): string {
  return readStored().trim();
}

export function setGeminiKey(key: string) {
  const next = key.trim();
  memory = next;
  if (typeof localStorage === 'undefined') return;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장을 막아 둔 브라우저에서는 이번 탭 메모리만 유지한다.
  }
}
