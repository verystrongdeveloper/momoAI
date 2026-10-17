import { encodeVideo } from './encode';
import type { VideoPayload } from './types';

declare global {
  interface Window {
    ReactNativeWebView: { postMessage: (message: string) => void };
    startVideoExport: (payload: VideoPayload) => void;
    acknowledgeVideoChunk: () => void;
  }
}

const post = (message: object) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
let acknowledge: (() => void) | undefined;
let started = false;
window.acknowledgeVideoChunk = () => { acknowledge?.(); acknowledge = undefined; };
window.startVideoExport = async (payload) => {
  if (started) return;
  started = true;
  try {
    const buffer = await encodeVideo(payload, {
      signal: new AbortController().signal,
      onProgress: (value) => post({ type: 'progress', ...value }),
    });
    post({ type: 'begin', size: buffer.byteLength });
    const bytes = new Uint8Array(buffer);
    for (let offset = 0; offset < bytes.length; offset += 196608) {
      const part = bytes.subarray(offset, Math.min(offset + 196608, bytes.length));
      let binary = '';
      for (let index = 0; index < part.length; index += 8192) binary += String.fromCharCode(...part.subarray(index, index + 8192));
      // Backpressure keeps base64 messages from filling the native bridge queue.
      const ready = new Promise<void>((resolve) => { acknowledge = resolve; });
      post({ type: 'chunk', data: btoa(binary) });
      await ready;
    }
    post({ type: 'complete' });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : 'VIDEO_ENCODE_FAILED' });
  }
};
post({ type: 'ready' });
