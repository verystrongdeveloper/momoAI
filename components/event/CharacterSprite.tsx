import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { emotionMap } from '@/constants/eventAssets';
import {
  getSpriteAspectRatio,
  SPRITE_BASELINE_RATIO,
  SPRITE_HEIGHT_RATIO,
} from '@/constants/spriteLayout';
import { useLayout } from '@/hooks/useLayout';

export interface SpriteAnimation {
  type: 'shake' | 'slide';
  axis: 'x' | 'y';
  distance: number;
  duration: number;
  iterations: number;
}

interface Props {
  current: string | null;
  fadeAnim: Animated.Value;
  expression?: { image: any; fadeAnim: Animated.Value } | null;
  animation?: SpriteAnimation | null;
}

/**
 * The assets are not exported on a shared canvas: some are 717x1280,
 * some are 1280x863, and NPC assets can be as small as 171x600.
 * A square `contain` box therefore makes wide assets look too small.
 * Normalize the rendered height and keep a common foot baseline instead.
 */
export default function CharacterSprite({ current, fadeAnim, expression, animation }: Props) {
  const { eventWidth, eventHeight, scale } = useLayout();
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const src = current ? emotionMap[current] : null;
  const aspectRatio = useMemo(
    () => (current && src ? getSpriteAspectRatio(current, src) : 1),
    [current, src],
  );
  const spriteHeight = eventHeight * SPRITE_HEIGHT_RATIO;
  const spriteWidth = spriteHeight * aspectRatio;

  const styles = useMemo(
    () => makeStyles(eventWidth, eventHeight, spriteWidth, spriteHeight, scale),
    [eventWidth, eventHeight, spriteWidth, spriteHeight, scale],
  );

  useEffect(() => {
    if (!animation) {
      translate.setValue({ x: 0, y: 0 });
      return;
    }

    const { type, axis, distance, duration, iterations } = animation;
    const move = (dist: number) =>
      Animated.timing(translate, {
        toValue: axis === 'x' ? { x: dist, y: 0 } : { x: 0, y: dist },
        duration,
        useNativeDriver: true,
      });
    const reset = move(0);

    const sequence: Animated.CompositeAnimation[] = [];
    if (type === 'shake') {
      for (let i = 0; i < iterations; i += 1) sequence.push(move(distance), move(-distance));
    } else {
      sequence.push(move(distance));
    }
    sequence.push(reset);

    Animated.sequence(sequence).start();
  }, [animation, translate]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateX: translate.x }, { translateY: translate.y }] },
      ]}
      pointerEvents="none"
    >
      {src ? <Image source={src} style={styles.char} resizeMode="contain" fadeDuration={0} /> : null}
      {expression && (
        <Animated.Image
          source={expression.image}
          style={[styles.expression, { opacity: expression.fadeAnim }]}
          resizeMode="contain"
          fadeDuration={0}
        />
      )}
    </Animated.View>
  );
}

const makeStyles = (W: number, H: number, spriteWidth: number, spriteHeight: number, scale: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: (W - spriteWidth) / 2,
      bottom: H * SPRITE_BASELINE_RATIO,
      width: spriteWidth,
      height: spriteHeight,
    },
    char: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
    },
    expression: {
      position: 'absolute',
      top: H * 0.04,
      right: Math.min(W * 0.02, spriteWidth * 0.08),
      width: 80 * scale,
      height: 80 * scale,
    },
  });
