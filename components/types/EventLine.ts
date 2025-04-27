export interface EventLine {
    type: 'dialogue' | 'selection' | 'narration' | 'command' | 'animation';
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
  