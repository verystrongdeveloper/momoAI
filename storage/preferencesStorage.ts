import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFERENCES, NATIVE_PREFERENCES_KEY, parsePreferences, Preferences } from './types';

export async function loadPreferences(): Promise<Preferences> {
  try {
    return parsePreferences(await AsyncStorage.getItem(NATIVE_PREFERENCES_KEY));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(NATIVE_PREFERENCES_KEY, JSON.stringify(prefs));
}
