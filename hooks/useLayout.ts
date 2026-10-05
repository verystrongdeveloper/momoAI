import { useWindowDimensions } from 'react-native';

export const COMPACT_BREAKPOINT = 768;

const EVENT_DESIGN_W = 1280;

export function useLayout() {
  const { width, height } = useWindowDimensions();
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
  const portrait = width < height && height > 0;
  const typeScale = portrait ? Math.sqrt(width / height) : 1;
  return Math.max(Math.round(floor * typeScale), Math.round(height * fraction * typeScale));
}
