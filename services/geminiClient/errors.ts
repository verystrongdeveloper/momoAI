export const GEMINI_OFFLINE_MESSAGE = '네트워크에 연결할 수 없어 Gemini를 호출하지 못했습니다.';
export const OPENAI_OFFLINE_MESSAGE = '네트워크에 연결할 수 없어 OpenAI Compatible API를 호출하지 못했습니다.';

export function throwIfOffline(message = GEMINI_OFFLINE_MESSAGE) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(message);
  }
}

export function geminiFailureText(err: unknown): string {
  if (err instanceof Error && err.message.includes('네트워크에 연결할 수 없어')) {
    return err.message;
  }
  if (err instanceof Error && /OpenAI Compatible|Base URL|모델 ID/.test(err.message)) return err.message;
  return '에러가 발생했어요.';
}
