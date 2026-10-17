import { useEffect, useRef } from 'react';
import { exportVideo } from './videoExport.web';
import type { VideoExportWorkerProps } from './VideoExportWorker.types';

export default function VideoExportWorker(props: VideoExportWorkerProps) {
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    const cancel = () => abort.abort();
    props.options.signal.addEventListener('abort', cancel, { once: true });
    if (props.options.signal.aborted) cancel();
    const run = async () => {
      if (!props.destination) throw new Error('SAVE_LOCATION_UNSUPPORTED');
      await exportVideo(props.payload, { signal: abort.signal, onProgress: (value) => active && latest.current.options.onProgress(value) }, props.destination);
    };
    void run()
      .then(() => { if (active) latest.current.onComplete(); })
      .catch((error) => { if (active) latest.current.onError(error instanceof Error ? error : new Error(String(error))); });
    return () => { active = false; abort.abort(); props.options.signal.removeEventListener('abort', cancel); };
  }, [props.payload]);
  return null;
}
