export interface ParsedChat {
    sender: string;
    text: string;
    delay: number;       // 대사 출력 전 지연
    afterDelay: number;  // 대사 출력 후 다음 대사까지 지연
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
          delay: parseInt(delay, 10),
          afterDelay,
        });
      }
    }
  
    return result;
  };
  