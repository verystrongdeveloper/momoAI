import { exportTextFile } from '@/platform/fileExport';
import { pickTextFile } from '@/platform/filePicker';
import { SavedStory } from '@/store/storyLibrary';

function fileNameOf(title: string) {
  const base = title.replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim() || '스토리';
  return `${base}.txt`;
}

/** txt 파일을 고르게 하고, 그 내용을 돌려준다. */
export function pickStoryFile(): Promise<string | null> {
  return pickTextFile();
}

/** 대본을 txt 파일로 내려받는다. */
export function downloadStory(story: SavedStory) {
  return exportTextFile(fileNameOf(story.title), `\uFEFF${story.script}`);
}
