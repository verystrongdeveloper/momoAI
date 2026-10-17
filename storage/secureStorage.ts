import * as SecureStore from 'expo-secure-store';
import { NATIVE_API_KEY, NATIVE_OPENAI_API_KEY } from './types';

export async function loadApiKey(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(NATIVE_API_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function saveApiKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(NATIVE_API_KEY, value);
}

export async function clearApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(NATIVE_API_KEY);
  } catch {
    // 없는 키를 지우는 경우는 무시한다.
  }
}

export async function loadOpenAiApiKey(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(NATIVE_OPENAI_API_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function saveOpenAiApiKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(NATIVE_OPENAI_API_KEY, value);
}

export async function clearOpenAiApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(NATIVE_OPENAI_API_KEY);
  } catch {
    // 없는 키를 지우는 경우는 무시한다.
  }
}
