import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { emotionMap } from '../constants/eventAssets'; // 경로는 실제 프로젝트에 맞게 조정하세요

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  current: string | null;
  fadeAnim: Animated.Value;
  expression?: {
    image: any;
    visible: boolean;
    fadeAnim: Animated.Value;
  } | null;
  animation?: {
    type: 'shake' | 'slide';
    axis: 'x' | 'y';
    distance: number;
    duration: number;
    iterations?: number;
  } | null;
}

export default function CharacterSprite({
  current,
  fadeAnim,
  expression,
  animation,
}: Props) {
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!animation) {
      translate.setValue({ x: 0, y: 0 });
      return;
    }

    const { type, axis, distance, duration, iterations = 1 } = animation;

    const oneCycle = (dist: number) =>
      Animated.timing(translate, {
        toValue: axis === 'x' ? { x: dist, y: 0 } : { x: 0, y: dist },
        duration,
        useNativeDriver: true,
      });

    const backToZero = Animated.timing(translate, {
      toValue: { x: 0, y: 0 },
      duration,
      useNativeDriver: true,
    });

    const seq: Animated.CompositeAnimation[] = [];

    if (type === 'shake') {
      for (let i = 0; i < iterations; i++) {
        seq.push(oneCycle(distance), oneCycle(-distance));
      }
      seq.push(backToZero);
    } else if (type === 'slide') {
      seq.push(oneCycle(distance), backToZero);
    }

    Animated.sequence(seq).start();
  }, [animation, translate]);

  /* ───────── style helpers ───────── */
  const charStyle = (key: string) => {
    const baseStyles: any[] = [ // 타입 any로 잠시 변경 (StyleProp<ImageStyle>[])
      styles.char,
      { opacity: key === current ? fadeAnim : 0 },
    ];
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // ★ 츠루기 캐릭터('tsurugi_')인 경우 추가 스타일 적용
    if (key && key.startsWith('tsurugi_')) {
      return [...baseStyles, styles.tsurugiChar];
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    return baseStyles;
  };

  const containerStyle = [
    styles.container,
    {
      transform: [
        { translateX: translate.x },
        { translateY: translate.y },
      ],
    },
  ];

  return (
    <Animated.View style={containerStyle} pointerEvents="none">
      {Object.entries(emotionMap).map(([key, src]) => (
        <Animated.Image
          key={key}
          source={src}
          style={charStyle(key)}
          fadeDuration={0}
        />
      ))}
      {expression && (
        <Animated.Image
          source={expression.image}
          style={[styles.expression, { opacity: expression.fadeAnim }]}
          fadeDuration={0}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -200,
    left: '10%',
    width: W * 0.7,
    aspectRatio: 2000 / 1200,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  char: {
    left: 0,
    width: '110%',
    height: '120%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // ★ 츠루기 전용 스타일 (예시)
  tsurugiChar: {
    // 예: 크기를 약간 다르게 하거나, 위치를 미세 조정할 수 있습니다.
    left: -250,
    bottom: -150,
    width: '140%', // 기본보다 약간 크게
    height: '135%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  expression: {
    position: 'absolute',
    top: H * 0.02,
    left: W * 0.30,
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});