import type { StorageSnapshot } from './types';

/** 네이티브 저장소는 동기 읽기가 없다. 첫 화면은 hydrate 이후 갱신된다. */
export function readInitialSync(): StorageSnapshot | null {
  return null;
}
