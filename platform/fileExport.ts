import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportTextFile(filename: string, contents: string): Promise<void> {
  const dir = FileSystem.cacheDirectory;
  if (!dir) throw new Error('파일을 저장할 수 없습니다.');
  const uri = `${dir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: filename });
  }
}
