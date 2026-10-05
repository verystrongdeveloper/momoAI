import { getSetting, saveSetting, subscribeStorage } from '@/storage';

const listeners = new Set<(volume: number) => void>();

function clamp(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const next = Math.min(1, Math.max(0, value));
  return Math.round(next * 100) / 100;
}

/** 저장된 효과음 볼륨. 0~1, 없으면 50%. */
export function getSfxVolume(): number {
  return getSetting('sfxVolume');
}

export function setSfxVolume(value: number): number {
  const next = clamp(value);
  if (next == null) return getSfxVolume();
  saveSetting('sfxVolume', next);
  return getSfxVolume();
}

export function subscribeSfxVolume(listener: (volume: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let announced = getSfxVolume();
subscribeStorage(() => {
  const next = getSfxVolume();
  if (next === announced) return;
  announced = next;
  listeners.forEach((listener) => listener(next));
});
