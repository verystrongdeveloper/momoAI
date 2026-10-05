import { DEFAULT_PREFERENCES, PREFERENCES_KEY, parsePreferences, Preferences } from './types';

function browserStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    return parsePreferences(browserStorage()?.getItem(PREFERENCES_KEY) ?? null);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  browserStorage()?.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}
