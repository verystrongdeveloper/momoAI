import { useMemo } from 'react';
import parseEventScript from '@/utils/parseEventScript';

export default function useEventParser(script: string) {
  return useMemo(() => parseEventScript(script), [script]);
}
