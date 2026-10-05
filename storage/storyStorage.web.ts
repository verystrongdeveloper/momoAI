import { sanitizeStories, StoryRecord } from './types';

const DB_NAME = 'momo-stories';
const STORE = 'stories';
const RECORD = 'library';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB를 사용할 수 없습니다.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function readStoryRecords(): Promise<StoryRecord[]> {
  try {
    const stored = await withStore<unknown>('readonly', (store) => store.get(RECORD));
    return sanitizeStories(stored);
  } catch {
    return [];
  }
}

export async function writeStoryRecords(stories: StoryRecord[]): Promise<void> {
  const next = sanitizeStories(stories);
  await withStore('readwrite', (store) => store.put(next, RECORD));
}
