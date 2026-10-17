import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export async function pickTextFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/plain', 'text/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const text = await new File(result.assets[0].uri).text();
  return text.replace(/^\uFEFF/, '');
}
