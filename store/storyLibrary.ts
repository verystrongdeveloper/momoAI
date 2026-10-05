const STORAGE_KEY = 'momo.storyLibrary';

export interface SavedStory {
  id: string;
  title: string;
  character: string;
  script: string;
  createdAt: number;
}

let memory: SavedStory[] = [];

function readStored(): SavedStory[] {
  if (typeof localStorage === 'undefined') return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && typeof item.script === 'string',
    );
  } catch {
    return memory;
  }
}

function writeStored(stories: SavedStory[]) {
  memory = stories;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch {
    // 용량이 가득 찬 브라우저에서는 이번 탭 메모리만 유지한다.
  }
}

const SKIP_SPEAKER = /^(타이틀|narration|selection|deleteAll|deleteEmotion|endEvent|waitSecond|bg|music|sound|animation)/;

function characterOf(script: string) {
  for (const raw of script.split('\n')) {
    const line = raw.trim();
    if (!line || SKIP_SPEAKER.test(line)) continue;
    const name = line.split('(')[0].split(':')[0].trim();
    if (name) return name;
  }
  return '스토리';
}

function titleOf(script: string, character: string) {
  const line = script
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.startsWith('타이틀'));
  const title = line?.replace(/^타이틀\s*:\s*/, '').trim();
  return title || `${character}의 스토리`;
}

export function listStories(): SavedStory[] {
  return readStored().slice().sort((a, b) => b.createdAt - a.createdAt);
}

/** 저장본의 대본을 바꾼다. 카드 제목은 대본의 타이틀 줄을 따른다. */
export function updateStory(id: string, script: string): SavedStory | null {
  const stories = readStored();
  const index = stories.findIndex((story) => story.id === id);
  if (index < 0) return null;
  const next = { ...stories[index], script, title: titleOf(script, stories[index].character) };
  stories[index] = next;
  writeStored(stories);
  return next;
}

/** 이 브라우저에 저장된 스토리 하나만 지운다. */
export function deleteStory(id: string) {
  writeStored(readStored().filter((story) => story.id !== id));
}

/** txt 대본을 라이브러리에 넣는다. 카드의 캐릭터는 첫 화자 이름을 따른다. */
export function importStory(script: string): SavedStory {
  return saveStory(characterOf(script), script);
}

/** 생성된 스크립트를 라이브러리에 넣는다. 재생은 그대로 이어진다. */
export function saveStory(character: string, script: string): SavedStory {
  const story: SavedStory = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: titleOf(script, character),
    character,
    script,
    createdAt: Date.now(),
  };
  writeStored([story, ...readStored()]);
  return story;
}
