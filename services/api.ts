const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`[api] ${path} ${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** 캐릭터가 먼저 말을 거는 선톡 */
  trigger: (character: string) =>
    post<{ triggerLine: string }>('/api/trigger', { character }),

  /** 1:1 채팅 */
  chat: (character: string, message: string) =>
    post<{ reply: string; eventReady: boolean }>('/api/chat', { character, message }),

  /** 최근 대화를 바탕으로 인연 이벤트 스크립트 생성 */
  createEvent: (character: string) =>
    post<{ eventScript: string }>('/api/event', { character }),

  /** 단톡방 입장/랜덤 트리거 */
  groupTrigger: (roomId: string) =>
    post<{ answer: string }>('/api/group/trigger', { roomId }),

  /** 단톡방 유저 발화 */
  groupChat: (roomId: string, userMessage: string) =>
    post<{ answer: string }>('/api/group/chat', { roomId, userMessage }),
};
