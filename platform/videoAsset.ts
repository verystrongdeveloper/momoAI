import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

export async function videoAssetUrl(source: Parameters<typeof Asset.fromModule>[0], mime: string): Promise<string> {
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  const assetMime: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', mp3: 'audio/mpeg', wav: 'audio/wav', ttf: 'font/ttf' };
  return `data:${assetMime[asset.type.toLowerCase()] ?? mime};base64,${await new File(asset.localUri ?? asset.uri).base64()}`;
}
