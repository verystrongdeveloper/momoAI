import type { FileSaveTarget } from './fileSave.types';

// Native workers save through Android Downloads or the system file sheet.
export async function chooseVideoSaveTarget(_filename: string, _signal?: AbortSignal): Promise<FileSaveTarget | undefined> {
  return undefined;
}
