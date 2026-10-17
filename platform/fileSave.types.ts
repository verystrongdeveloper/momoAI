export type FileSaveTarget = {
  kind: 'download' | 'save-as';
  save: (data: ArrayBuffer, signal?: AbortSignal) => Promise<void>;
  cancel?: () => Promise<void>;
};
