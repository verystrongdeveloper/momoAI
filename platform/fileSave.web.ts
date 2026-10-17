import type { FileSaveTarget } from './fileSave.types';

type WritableFile = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
  abort: () => Promise<void>;
};
type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{ createWritable: () => Promise<WritableFile> }>;
};

function check(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('EXPORT_CANCELED');
}

async function chooseLocalTarget(filename: string, extension: string, signal?: AbortSignal): Promise<FileSaveTarget | null | undefined> {
  const host = window.location?.hostname;
  if (!host || !['localhost', '127.0.0.1', '[::1]'].includes(host)) return undefined;
  const endpoint = `http://${host}:3000/api/local-file-save`;
  // Only probe our loopback backend, never upload files to a remote API server.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  let supported = false;
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    supported = response.ok && (await response.json()).supported === true;
  } catch { /* Older or unavailable backend: normal browser download remains available. */ }
  finally { clearTimeout(timer); }
  check(signal);
  if (!supported) return undefined;
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, extension }), signal });
  if (!response.ok) throw new Error('SAVE_DIALOG_FAILED');
  const result = await response.json();
  if (result.canceled) return null;
  if (typeof result.token !== 'string' || !/^[a-f0-9]{64}$/.test(result.token)) throw new Error('SAVE_DIALOG_FAILED');
  return {
    kind: 'save-as',
    cancel: async () => { await fetch(`${endpoint}/${result.token}`, { method: 'DELETE' }); },
    save: async (data, signal) => {
      check(signal);
      const saved = await fetch(`${endpoint}/${result.token}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: data, signal });
      if (!saved.ok) throw new Error('FILE_SAVE_FAILED');
    },
  };
}

/** Call directly from a click handler, before encoding or other asynchronous work. */
export async function chooseFileSaveTarget(filename: string, mime: string, extension: string, signal?: AbortSignal): Promise<FileSaveTarget | null> {
  if ('__TAURI_INTERNALS__' in window) {
    const [{ save }, { writeFile }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-fs')]);
    const path = await save({ defaultPath: filename, filters: [{ name: extension.toUpperCase(), extensions: [extension] }] });
    if (!path) return null;
    return {
      kind: 'save-as',
      save: async (data, signal) => {
        check(signal);
        await writeFile(path, new Uint8Array(data));
      },
    };
  }
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!mobile) {
    const picker = (window as SavePickerWindow).showSaveFilePicker;
    if (picker) try {
      // The picker must open while the initiating user gesture is still active.
      const handle = await picker.call(window, { suggestedName: filename, types: [{ description: extension.toUpperCase(), accept: { [mime]: [`.${extension}`] } }] });
      // Acquire write permission now too: createWritable may display an additional
      // permission dialog. Never defer any interactive filesystem step until encoding ends.
      check(signal);
      const writable = await handle.createWritable();
      let finished = false;
      const cancel = async () => {
        if (finished) return;
        finished = true;
        await writable.abort().catch(() => undefined);
      };
      if (signal?.aborted) { await cancel(); check(signal); }
      return {
        kind: 'save-as',
        cancel,
        save: async (data, signal) => {
          try {
            check(signal);
            if (finished) throw new Error('EXPORT_CANCELED');
            await writable.write(new Blob([data], { type: mime }));
            check(signal);
            await writable.close();
            finished = true;
          } catch (error) {
            await cancel();
            throw error;
          }
        },
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return null;
      if (!(error && typeof error === 'object' && 'name' in error && ['SecurityError', 'NotAllowedError', 'NotSupportedError'].includes(String(error.name)))) throw error;
    }
    const local = await chooseLocalTarget(filename, extension, signal);
    if (local !== undefined) return local;
  }
  return {
    kind: 'download',
    save: async (data, signal) => {
      check(signal);
      const url = URL.createObjectURL(new Blob([data], { type: mime }));
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000); }
    },
  };
}
