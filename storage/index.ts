import {
  clearApiKey,
  clearOpenAiApiKey,
  loadApiKey,
  loadOpenAiApiKey,
  saveApiKey as writeApiKey,
  saveOpenAiApiKey as writeOpenAiApiKey,
} from './secureStorage';
import { loadPreferences, savePreferences } from './preferencesStorage';
import { readStoryRecords, writeStoryRecords } from './storyStorage';
import { migrateLegacyStorage } from './migrate';
import { readInitialSync } from './prime';
import { AIProvider, AppLanguage, DEFAULT_PREFERENCES, Preferences, StoryRecord, clampVolume } from './types';

type SettingKey = keyof Preferences;

let synced = readInitialSync() != null;

export function isStorageSynced() {
  return synced;
}

let memory: Preferences & { apiKey: string; openAiApiKey: string; stories: StoryRecord[] } = {
  apiKey: '',
  openAiApiKey: '',
  ...DEFAULT_PREFERENCES,
  stories: [],
};

const initial = readInitialSync();
if (initial) memory = initial;

const listeners = new Set<() => void>();
let hydrated = false;
let dirty = false;
let hydratePromise: Promise<void> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeStorage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getApiKey() {
  return memory.apiKey.trim();
}

export function getOpenAiApiKey() {
  return memory.openAiApiKey.trim();
}

export function getRememberApiKey() {
  return memory.rememberApiKey;
}

export function getSetting(key: 'bgmVolume' | 'sfxVolume'): number;
export function getSetting(key: 'language'): AppLanguage;
export function getSetting(key: 'aiProvider'): AIProvider;
export function getSetting(key: 'openAiBaseUrl' | 'openAiModel'): string;
export function getSetting(key: 'greetMode' | 'rememberApiKey' | 'rememberOpenAiApiKey' | 'termsAccepted' | 'tutorialSeen'): boolean;
export function getSetting(key: SettingKey): number | boolean | string | AppLanguage | AIProvider {
  return memory[key];
}

export function loadStories(): StoryRecord[] {
  return memory.stories;
}

async function persistAll() {
  const prefs: Preferences = {
    language: memory.language,
    bgmVolume: memory.bgmVolume,
    sfxVolume: memory.sfxVolume,
    greetMode: memory.greetMode,
    rememberApiKey: memory.rememberApiKey,
    aiProvider: memory.aiProvider,
    rememberOpenAiApiKey: memory.rememberOpenAiApiKey,
    openAiBaseUrl: memory.openAiBaseUrl,
    openAiModel: memory.openAiModel,
    termsAccepted: memory.termsAccepted,
    tutorialSeen: memory.tutorialSeen,
  };
  const keyTask = memory.rememberApiKey && memory.apiKey ? writeApiKey(memory.apiKey) : clearApiKey();
  const openAiKeyTask = memory.rememberOpenAiApiKey && memory.openAiApiKey
    ? writeOpenAiApiKey(memory.openAiApiKey)
    : clearOpenAiApiKey();
  await Promise.all([keyTask, openAiKeyTask, savePreferences(prefs), writeStoryRecords(memory.stories)]);
}

/** remember가 켜져 있을 때만 키를 기기에 남긴다. 꺼져 있으면 이번 실행 메모리만 유지한다. */
export function saveApiKey(key: string, remember = memory.rememberApiKey) {
  memory.apiKey = key.trim();
  memory.rememberApiKey = remember;
  dirty = true;
  emit();
  if (hydrated) void persistAll().catch(() => undefined);
}

export function saveOpenAiCompatibleSettings(settings: {
  apiKey: string;
  rememberApiKey: boolean;
  baseUrl: string;
  model: string;
}) {
  memory.openAiApiKey = settings.apiKey.trim();
  memory.rememberOpenAiApiKey = settings.rememberApiKey;
  memory.openAiBaseUrl = settings.baseUrl.trim() || DEFAULT_PREFERENCES.openAiBaseUrl;
  memory.openAiModel = settings.model.trim();
  dirty = true;
  emit();
  if (hydrated) void persistAll().catch(() => undefined);
}

export function saveSetting(key: SettingKey, value: Preferences[SettingKey]) {
  if (key === 'language') {
    if (value !== 'ko' && value !== 'en' && value !== 'ja' && value !== 'zh') return;
    if (value === memory.language) return;
    memory.language = value;
  } else if (key === 'bgmVolume' || key === 'sfxVolume') {
    if (typeof value !== 'number') return;
    const next = clampVolume(value);
    if (next == null || next === memory[key]) return;
    memory[key] = next;
  } else if (key === 'aiProvider') {
    if (value !== 'gemini' && value !== 'openai-compatible') return;
    if (value === memory.aiProvider) return;
    memory.aiProvider = value;
  } else if (key === 'openAiBaseUrl' || key === 'openAiModel') {
    if (typeof value !== 'string') return;
    const next = value.trim();
    if (next === memory[key]) return;
    memory[key] = next;
  } else if (
    key === 'greetMode' ||
    key === 'rememberApiKey' ||
    key === 'rememberOpenAiApiKey' ||
    key === 'termsAccepted' ||
    key === 'tutorialSeen'
  ) {
    const next = value === true;
    if (next === memory[key]) return;
    memory[key] = next;
  } else {
    return;
  }
  dirty = true;
  emit();
  if (hydrated) void persistAll().catch(() => undefined);
}

export function saveStories(stories: StoryRecord[]) {
  memory.stories = stories;
  dirty = true;
  emit();
  if (hydrated) void writeStoryRecords(stories).catch(() => undefined);
}

async function pullAll() {
  const prefs = await loadPreferences();
  const apiKey = prefs.rememberApiKey ? (await loadApiKey()).trim() : '';
  const openAiApiKey = prefs.rememberOpenAiApiKey ? (await loadOpenAiApiKey()).trim() : '';
  const stories = await readStoryRecords();
  if (dirty) return;
  memory = { ...prefs, apiKey, openAiApiKey, stories };
}

export function hydrateStorage() {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const migrated = await migrateLegacyStorage();
        if (!dirty && migrated) await pullAll();
        hydrated = true;
        if (dirty) await persistAll();
      } catch {
        hydrated = true;
      } finally {
        synced = true;
        emit();
      }
    })();
  }
  return hydratePromise;
}
