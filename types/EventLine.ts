export interface EventLine {
    type: 'dialogue' | 'selection' | 'narration' | 'command' | 'animation' | '타이틀';
    character?: string;
    text?: string;
    emotion?: string;
    bg?: string;
    music?: string;
    options?: string[];
    commandType?: string;
    waitSecond?: number;
    soundFile?: string;
    expression?: string;
    animationType?: string;
  }
  