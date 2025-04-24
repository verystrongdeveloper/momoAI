import React from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { emotionMap } from '../constants/eventAssets';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  current: string | null;          // 현재 표시할 emotion key
  fadeAnim: Animated.Value;        // opacity 제어
}

/**  
 * 모든 캐릭터 이미지를 항상 렌더하여 캐시 유지,  
 * current 일치 여부에 따라 투명도만 토글  
 */
export default function CharacterSprite({ current, fadeAnim }: Props) {
  return (
    <>
      {Object.entries(emotionMap).map(([key, src]) => (
        <Animated.Image
          key={key}
          source={src}
          style={[
            styles.char,
            { opacity: key === current ? fadeAnim : 0 },
          ]}
          fadeDuration={0}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  char: {
    position: 'absolute',
    bottom: H * -0.15,
    left: W * 0.48,
    width: W * 0.7,
    height: H * 0.9,
    transform: [{ translateX: -(W * 0.7) / 2 }],
    resizeMode: 'contain',
    pointerEvents: 'none',
  },
});
