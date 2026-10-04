/**
 * 이벤트 스크립트는 수천 자에 달하므로 URL 파라미터 대신 메모리에 보관한다.
 * 채팅 화면에서 setPendingEvent → /event 화면에서 consumePendingEvent 순으로 사용.
 */
let pendingScript: string | null = null;

export function setPendingEvent(script: string) {
  pendingScript = script;
}

export function consumePendingEvent(): string | null {
  const script = pendingScript;
  pendingScript = null;
  return script;
}
