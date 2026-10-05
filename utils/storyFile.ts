import { SavedStory } from '@/store/storyLibrary';

function fileNameOf(title: string) {
  const base = title.replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim() || '스토리';
  return `${base}.txt`;
}

/** 이 브라우저에서 txt 파일을 고르게 하고, 그 내용을 돌려준다. */
export function pickStoryFile(): Promise<string | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => finish(typeof reader.result === 'string' ? reader.result.replace(/^\uFEFF/, '') : null);
      reader.onerror = () => finish(null);
      reader.readAsText(file);
    });
    input.addEventListener('cancel', () => finish(null));
    input.click();
  });
}

/** 대본을 txt 파일로 내려받는다. */
export function downloadStory(story: SavedStory) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([`\uFEFF${story.script}`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNameOf(story.title);
  link.click();
  URL.revokeObjectURL(url);
}
