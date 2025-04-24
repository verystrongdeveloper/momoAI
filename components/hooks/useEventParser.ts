import { useMemo } from 'react';
import { EventLine } from '../types/EventLine';

/**  
 * 스크립트 문자열 → EventLine[]  
 * useMemo로 래핑해 script가 변할 때만 재계산  
 */
export default function useEventParser(script: string) {
  return useMemo<EventLine[]>(() => {
    const out: EventLine[] = [];

    script
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .forEach(l => {
        if (l.startsWith('타이틀')) return;

        if (l.startsWith('selection')) {
          const opts = [...l.matchAll(/\(\d+\)"(.*?)"/g)].map(m => m[1]);
          out.push({ type: 'selection', text: '', options: opts });
          return;
        }

        if (l.startsWith('narration')) {
          const txt = l.match(/narration\s*:\s*(.+?)(?:\[|$)/)?.[1].trim() || '';
          const bg = l.match(/bg\s*:\s*(BG_[\w]+\.jpg)/)?.[1]?.replace('.jpg', '');
          const mus = l.match(/music\s*:\s*([\w_-]+\.mp3|none)/)?.[1];
          out.push({ type: 'narration', character: '', text: txt, bg, music: mus });
          return;
        }

        if (/^(deleteAll|deleteEmotion|endEvent)/.test(l)) {
          out.push({ type: 'command', commandType: l.trim(), text: '' });
          return;
        }

        if (l.startsWith('waitSecond')) {
          const s = Number(l.replace(/[^\d]/g, '')) || 1;
          out.push({ type: 'command', commandType: 'waitSecond', waitSecond: s, text: '' });
          return;
        }

        /* 일반 대사 */
        const i = l.indexOf(':');
        if (i === -1) return;
        const spk = l.slice(0, i).trim();
        const rest = l.slice(i + 1).trim();
        const emo = rest.match(/emotion\s*:\s*([\w_]+\.png)/)?.[1]?.replace('.png', '');
        const bg = rest.match(/bg\s*:\s*(BG_[\w]+\.jpg)/)?.[1]?.replace('.jpg', '');
        const mus = rest.match(/music\s*:\s*([\w_-]+\.mp3|none)/)?.[1];
        const snd = rest.match(/sound\s*:\s*([\w'_.-]+\.mp3)/)?.[1];
        const txt = rest.replace(/\[.*?]/g, '').trim();
        out.push({ type: 'dialogue', character: spk, text: txt, emotion: emo, bg, music: mus, soundFile: snd });
      });

    return out;
  }, [script]);
}
