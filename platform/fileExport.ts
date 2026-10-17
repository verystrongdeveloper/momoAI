import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportTextFile(filename: string, contents: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('파일 공유를 사용할 수 없습니다.');
  const directory = new Directory(Paths.cache, 'story-exports');
  directory.create({ idempotent: true });
  const file = new File(directory, filename);
  file.create({ overwrite: true });
  file.write(contents);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    UTI: 'public.plain-text',
    dialogTitle: filename,
  });
}
