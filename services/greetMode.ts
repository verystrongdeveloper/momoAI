const STORAGE_KEY = 'momo.greetMode';

let memory = false;

function readStored(): boolean {
  if (typeof localStorage === 'undefined') return memory;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return memory;
  }
}

/** 방에 들어갈 때 캐릭터가 먼저 말을 걸지. 기본은 끔. */
export function getGreetMode(): boolean {
  return readStored();
}

export function setGreetMode(on: boolean) {
  memory = on;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    // 저장을 막아 둔 브라우저에서는 이번 탭 메모리만 유지한다.
  }
}
