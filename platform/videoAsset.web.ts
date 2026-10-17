import { Asset } from 'expo-asset';

export async function videoAssetUrl(source: Parameters<typeof Asset.fromModule>[0], _mime: string): Promise<string> {
  return Asset.fromModule(source).uri;
}
