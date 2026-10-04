/** 한 대사가 나온 뒤 다음 대사가 나오기까지 이 값을 넘기지 않는다. */
const MAX_CHAT_SECOND = 10;

export interface ParsedChat {
    sender: string;
    text: string;
    delay: number;       // 대사 출력 전 지연
    afterDelay: number;  // 대사 출력 후 다음 대사까지 지연
  }

function clampSecond(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, MAX_CHAT_SECOND);
}
  
  export const parseGroupChat = (raw: string): ParsedChat[] => {
    const lines = raw.trim().split('\n');
    const result: ParsedChat[] = [];
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/^\[(.+?)\]\s*:\s*(.+?)\s*\[second\s*:\s*(\d+)\]$/);
      if (match) {
        const [, sender, text, delay] = match;
        const afterMatch = lines[i + 1]?.match(/^\[second\s*:\s*(\d+)\]$/);
        const afterDelay = afterMatch ? parseInt(afterMatch[1], 10) : 0;
        if (afterMatch) i++; // 다음 줄은 소비함
  
        result.push({
          sender,
          text: text.trim(),
          delay: clampSecond(parseInt(delay, 10)),
          afterDelay: clampSecond(afterDelay),
        });
      }
    }

    // 이전 대사 후 공백 + 다음 대사 타이핑이 합쳐 10초를 넘기면 비율대로 줄인다.
    for (let i = 0; i < result.length - 1; i++) {
      const gap = result[i].afterDelay + result[i + 1].delay;
      if (gap <= MAX_CHAT_SECOND) continue;
      const after = Math.round((result[i].afterDelay / gap) * MAX_CHAT_SECOND);
      result[i].afterDelay = after;
      result[i + 1].delay = MAX_CHAT_SECOND - after;
    }
  
    return result;
  };
  