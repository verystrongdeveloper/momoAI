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
