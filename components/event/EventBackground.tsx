import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { bgMap } from '@/constants/eventAssets';

interface Props {
  bgKey: string | null;
  fadeAnim: Animated.Value;        // 외부에서 관리하는 opacity
}

export default function EventBackground({ bgKey, fadeAnim }: Props) {
  if (!bgKey) return null;
  return (
    <Animated.Image
      source={bgMap[bgKey as keyof typeof bgMap]}
      style={[styles.bg, { opacity: fadeAnim }]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', width: '100%', height: '100%' },
});
