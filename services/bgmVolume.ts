import { getSetting, saveSetting, subscribeStorage } from '@/storage';

const listeners = new Set<(volume: number) => void>();

function clamp(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const next = Math.min(1, Math.max(0, value));
  return Math.round(next * 100) / 100;
}

/** 저장된 BGM 볼륨. 0~1, 없으면 50%. */
export function getBgmVolume(): number {
  return getSetting('bgmVolume');
}

export function setBgmVolume(value: number): number {
  const next = clamp(value);
  if (next == null) return getBgmVolume();
  saveSetting('bgmVolume', next);
  return getBgmVolume();
}

export function subscribeBgmVolume(listener: (volume: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let announced = getBgmVolume();
subscribeStorage(() => {
  const next = getBgmVolume();
  if (next === announced) return;
  announced = next;
  listeners.forEach((listener) => listener(next));
});
