import React, { useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GeminiKeyField from './GeminiKeyField';
import { getBgmVolume, setBgmVolume, subscribeBgmVolume } from '@/services/bgmVolume';

const clamp = (value: number) => {
  if (!Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
};

export default function SettingsPanel() {
  const [volume, setVolume] = useState(getBgmVolume);
  const volumeRef = useRef(volume);
  const trackRef = useRef<View>(null);
  volumeRef.current = volume;

  useEffect(
    () =>
      subscribeBgmVolume((next) => {
        volumeRef.current = next;
        setVolume(next);
      }),
    [],
  );

  const apply = (value: number) => {
    const next = setBgmVolume(value);
    volumeRef.current = next;
    setVolume(next);
  };

  const setFromPress = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    const node = trackRef.current as (View & { getBoundingClientRect?: () => { left: number; width: number } }) | null;
    if (!node || !Number.isFinite(pageX)) return;

    if (typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const scrollX = typeof window === 'undefined' ? 0 : window.scrollX;
      const next = clamp((pageX - (rect.left + scrollX)) / rect.width);
      if (next != null) apply(next);
      return;
    }

    node.measureInWindow((left, _top, width) => {
      const next = clamp((pageX - left) / width);
      if (next != null) apply(next);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      <View style={styles.card}>
        <Text style={styles.label}>BGM 볼륨</Text>
        <Text style={styles.value}>{Math.round(volume * 100)}%</Text>
        <Pressable ref={trackRef} style={styles.track} onPress={setFromPress}>
          <View pointerEvents="none" style={[styles.fill, { width: `${volume * 100}%` }]} />
        </Pressable>
        <View style={styles.stepRow}>
          <TouchableOpacity style={styles.step} onPress={() => apply(volumeRef.current - 0.1)}>
            <Text style={styles.stepText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.step} onPress={() => apply(volumeRef.current + 0.1)}>
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>스토리 안에서 바꾼 볼륨과 같습니다.</Text>
      </View>

      <View style={styles.keyWrap}>
        <GeminiKeyField />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4f5',
    padding: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
  },
  card: {
    alignSelf: 'flex-start',
    width: 420,
    maxWidth: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eceff3',
    marginBottom: 16,
  },
  keyWrap: {
    alignSelf: 'flex-start',
    width: 420,
    maxWidth: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243e5c',
  },
  value: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 16,
    color: '#3d6288',
  },
  track: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#d5e4f2',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#4d8ec9',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  step: {
    width: 48,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e7f1fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d6ea8',
  },
  hint: {
    marginTop: 14,
    fontSize: 13,
    color: '#6a8298',
  },
});
