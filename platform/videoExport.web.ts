import { encodeVideo } from '@/services/videoExport/encode';
import { checkAborted, type ExportOptions, type VideoPayload } from '@/services/videoExport/types';
import type { FileSaveTarget } from './fileSave.types';

export async function exportVideo(payload: VideoPayload, options: ExportOptions, destination: FileSaveTarget): Promise<void> {
  const buffer = await encodeVideo(payload, options);
  checkAborted(options.signal);
  options.onProgress({ phase: 'saving', progress: 0.98 });
  await destination.save(buffer, options.signal);
}
