import type { ExportOptions, VideoPayload } from '@/services/videoExport/types';
import type { FileSaveTarget } from './fileSave.types';

export type VideoExportWorkerProps = {
  payload: VideoPayload;
  options: ExportOptions;
  destination?: FileSaveTarget;
  onComplete: () => void;
  onError: (error: Error) => void;
};
