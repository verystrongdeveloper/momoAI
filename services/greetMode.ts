import { getSetting, saveSetting, subscribeStorage } from '@/storage';

/** 방에 들어갈 때 캐릭터가 먼저 말을 걸지. 기본은 끔. */
export function getGreetMode(): boolean {
  return getSetting('greetMode');
}

export function setGreetMode(on: boolean) {
  saveSetting('greetMode', on);
}

export function subscribeGreetMode(listener: () => void) {
  return subscribeStorage(listener);
}
