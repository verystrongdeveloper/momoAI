import { createContext, useContext, useState, type ReactNode } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { eventStoryFont } from '@/utils/eventPresentation';

export const COMPACT_BREAKPOINT = 768;

const EVENT_DESIGN_W = 1280;

const FrameContext = createContext<{ width: number; height: number } | null>(null);

/** 스토리 장면이 창 크기보다 작게 잡히면 위아래에 남색 여백이 생긴다. 실제 화면 크기를 쓴다. */
export function EventFrame({ children }: { children: ReactNode }) {
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <FrameContext.Provider value={frame}>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {children}
      </View>
    </FrameContext.Provider>
  );
}

export function useLayout() {
  const viewport = useWindowDimensions();
  const frame = useContext(FrameContext);
  const width = frame?.width || viewport.width;
  const height = frame?.height || viewport.height;
  const isCompact = width < COMPACT_BREAKPOINT;

  // Keep the scene full-bleed. On ultrawide screens, background artwork is
  // cropped by `cover` rather than showing black letterbox bars.
  const eventWidth = width;
  const eventHeight = height;
  const scale = eventWidth / EVENT_DESIGN_W;

  return { width, height, isCompact, scale, eventWidth, eventHeight };
}

/**
 * 스토리 글씨 크기.
 * 가로 화면은 높이를 기준으로 둔다.
 * 세로 화면은 가로/세로 비율의 제곱근만큼 줄여, 더 길쭉한 화면일수록 더 작아지게 한다.
 */
export function storyFont(width: number, height: number, fraction: number, floor: number) {
  return eventStoryFont(width, height, fraction, floor);
}
