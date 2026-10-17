import { chooseFileSaveTarget } from './fileSave.web';

export async function chooseVideoSaveTarget(filename: string, signal?: AbortSignal) {
  const target = await chooseFileSaveTarget(filename, 'video/mp4', 'mp4', signal);
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Desktop video must never start encoding without a user-selected destination.
  if (!mobile && target?.kind === 'download') throw new Error('SAVE_LOCATION_UNSUPPORTED');
  return target;
}
