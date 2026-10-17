import { getApiKey, getOpenAiApiKey, getSetting, saveOpenAiCompatibleSettings, saveSetting, subscribeStorage } from '@/storage';
import type { AIProvider } from '@/storage/types';

export type OpenAiCompatibleConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function getAIProvider(): AIProvider {
  return getSetting('aiProvider');
}

export function setAIProvider(provider: AIProvider) {
  saveSetting('aiProvider', provider);
}

export function getCurrentAIKey(): string {
  return getAIProvider() === 'gemini' ? getApiKey() : getOpenAiApiKey();
}

export function getCurrentAIIdentity(): string {
  const provider = getAIProvider();
  const config = provider === 'gemini'
    ? `gemini:${getApiKey()}`
    : `openai-compatible:${getOpenAiApiKey()}:${getSetting('openAiBaseUrl')}:${getSetting('openAiModel')}`;
  let hash = 0;
  for (let i = 0; i < config.length; i += 1) hash = Math.imul(31, hash) + config.charCodeAt(i);
  return `${provider}:${(hash >>> 0).toString(16)}`;
}

export function getOpenAiCompatibleConfig(): OpenAiCompatibleConfig {
  return {
    apiKey: getOpenAiApiKey(),
    baseUrl: getSetting('openAiBaseUrl'),
    model: getSetting('openAiModel'),
  };
}

export function saveOpenAiConfig(settings: OpenAiCompatibleConfig & { rememberApiKey: boolean }) {
  saveOpenAiCompatibleSettings(settings);
}

export function isCurrentAIConfigured(): boolean {
  if (!getCurrentAIKey()) return false;
  if (getAIProvider() === 'gemini') return true;
  const { baseUrl, model } = getOpenAiCompatibleConfig();
  return Boolean(baseUrl.trim() && model.trim());
}

export const subscribeAISettings = subscribeStorage;
