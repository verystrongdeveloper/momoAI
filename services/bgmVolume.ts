const STORAGE_KEY = 'momo.bgmVolume';

let memory = 1;
const listeners = new Set<(volume: number) => void>();

function clamp(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const next = Math.min(1, Math.max(0, value));
  return Math.round(next * 100) / 100;
}

function readStored(): number {
  if (typeof localStorage === 'undefined') return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return 1;
    return clamp(Number(raw)) ?? 1;
  } catch {
    return memory;
  }
}

/** 이 브라우저에 저장해 둔 BGM 볼륨. 0~1, 기본값 1. */
export function getBgmVolume(): number {
  return readStored();
}

export function setBgmVolume(value: number): number {
  const next = clamp(value);
  if (next == null) return getBgmVolume();
  const prev = getBgmVolume();
  memory = next;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // 저장을 막아 둔 브라우저에서는 이번 탭 메모리만 유지한다.
    }
  }
  if (prev !== next) listeners.forEach((fn) => fn(next));
  return next;
}

export function subscribeBgmVolume(listener: (volume: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
