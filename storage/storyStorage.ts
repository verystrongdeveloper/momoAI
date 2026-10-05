import AsyncStorage from '@react-native-async-storage/async-storage';
import { NATIVE_STORIES_KEY, parseStories, sanitizeStories, StoryRecord } from './types';

export async function readStoryRecords(): Promise<StoryRecord[]> {
  try {
    return parseStories(await AsyncStorage.getItem(NATIVE_STORIES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function writeStoryRecords(stories: StoryRecord[]): Promise<void> {
  await AsyncStorage.setItem(NATIVE_STORIES_KEY, JSON.stringify(sanitizeStories(stories)));
}
