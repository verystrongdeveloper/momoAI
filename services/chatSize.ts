import { useSyncExternalStore } from 'react';
import { getSetting, saveSetting, subscribeStorage } from '@/storage';
import { DEFAULT_PREFERENCES } from '@/storage/types';

export function getChatSize() {
  return getSetting('chatSize');
}

export function setChatSize(size: number) {
  saveSetting('chatSize', size);
}

export function useChatSize() {
  return useSyncExternalStore(subscribeStorage, getChatSize, () => DEFAULT_PREFERENCES.chatSize);
}
