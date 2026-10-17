import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

export async function videoAssetUrl(source: Parameters<typeof Asset.fromModule>[0], mime: string): Promise<string> {
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  return `data:${mime};base64,${await new File(asset.localUri ?? asset.uri).base64()}`;
}
