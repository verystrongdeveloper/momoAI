import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { emotionMap } from '../constants/eventAssets';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  /** 현재 표시할 emotion 키(
   *  ex. 'hina_surprised.png') – 없으면 null */
  current: string | null;
  /** 페이드 인·아웃용 opacity */
  fadeAnim: Animated.Value;
  /** 캐릭터 위 이모션 버블 */
  expression?: {
    image: any;
    visible: boolean;
    fadeAnim: Animated.Value;
  } | null;
  /** shake / slide 애니메이션 정보  */
  animation?: {
    type: 'shake' | 'slide'; // 흔들기 or 미끄러지기
    axis: 'x' | 'y';         // 움직일 축
    distance: number;        // 한 번 이동 픽셀
    duration: number;        // 한 번에 걸릴 시간(ms)
    iterations?: number;     // shake 반복 횟수
  } | null;
}

/*  ──────────────────────────────────────────
    ■ 변경 핵심
    1) translateAnim → Animated.ValueXY 로 변경
    2) 모든 emotion·expression 을 감싸는
       Animated.View 를 만든 뒤 거기에 transform 적용
    이렇게 하면 “스프라이트 전체” 가 통째로 이동합니다.
   ────────────────────────────────────────── */
export default function CharacterSprite({
  current,
  fadeAnim,
  expression,
  animation,
}: Props) {
  // XY 좌표를 동시에 다루기 위해 ValueXY 사용
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  /* animation prop 이 바뀔 때마다 실행 */
  useEffect(() => {
    if (!animation) {
      // 애니메이션이 끝나면 위치 초기화
      translate.setValue({ x: 0, y: 0 });
      return;
    }

    const { type, axis, distance, duration, iterations = 1 } = animation;

    /** 특정 축만 왕복 이동하는 helper */
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
      // shake: ( +dist → -dist ) n회
      for (let i = 0; i < iterations; i++) {
        seq.push(oneCycle(distance), oneCycle(-distance));
      }
      seq.push(backToZero);
    } else if (type === 'slide') {
      // slide: ( +dist → 0 ) 1회
      seq.push(oneCycle(distance), backToZero);
    }

    Animated.sequence(seq).start();
  }, [animation, translate]);

  /* ───────── style helpers ───────── */
  const charStyle = (key: string) => [
    styles.char,
    { opacity: key === current ? fadeAnim : 0 },
  ];

  const containerStyle = [
    styles.container,
    {
      transform: [
        { translateX: translate.x },
        { translateY: translate.y },
      ],
    },
  ];

  /* ───────── render ───────── */
  return (
    <Animated.View style={containerStyle} pointerEvents="none">
      {/* 감정 스프라이트들 (opacity 로 토글) */}
      {Object.entries(emotionMap).map(([key, src]) => (
        <Animated.Image
          key={key}
          source={src}
          style={charStyle(key)}
          fadeDuration={0}
        />
      ))}

      {/* 이모션 버블 */}
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

/* ───────── style ───────── */
const styles = StyleSheet.create({
  /* 스프라이트 전체 컨테이너 */
  container: {
    position: 'absolute',
    bottom: -200,       // 원본 위치 (필요하면 조절)
    left: '10%',
    width: W * 0.7,
    aspectRatio: 2000 / 1200,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  /* 각 emotion PNG */
  char: {
    left: 100,
    width: '110%',
    height: '120%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  
  /* 이모션 버블 위치 (캐릭터 왼쪽 위) */
  expression: {
    position: 'absolute',
    top: H * 0.02,      // 캐릭터 상단 기준 위치
    left: W * 0.35,     // 캐릭터 왼쪽 기준 위치
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});
