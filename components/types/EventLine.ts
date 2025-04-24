export interface EventLine {
    type: 'dialogue' | 'selection' | 'narration' | 'command';
    character?: string;
    text: string;
    emotion?: string;
    bg?: string;
    music?: string;
    options?: string[];
    commandType?: string;
    waitSecond?: number;
    soundFile?: string;
  }
  