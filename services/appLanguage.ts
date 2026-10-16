import { getSetting, saveSetting, subscribeStorage } from '@/storage';
import type { AppLanguage } from '@/storage/types';

export const APP_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export function getAppLanguage(): AppLanguage {
  return getSetting('language');
}

export function setAppLanguage(language: AppLanguage) {
  saveSetting('language', language);
}

export function subscribeAppLanguage(listener: () => void) {
  return subscribeStorage(listener);
}
