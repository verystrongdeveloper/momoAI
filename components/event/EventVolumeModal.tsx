import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLayout } from '@/hooks/useLayout';
import { getSfxVolume, setSfxVolume, subscribeSfxVolume } from '@/services/sfxVolume';

interface Props {
  volume: number;
  muted: boolean;
  onChange: (volume: number) => void;
  onToggleMute: () => void;
  onClose: () => void;
  onExit: () => void;
}

const clamp = (value: number) => {
  if (!Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
};

function VolumeSlider({
  label,
  value,
  muted,
  onChange,
  styles,
}: {
  label: string;
  value: number;
  muted: boolean;
  onChange: (volume: number) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const trackRef = useRef<View>(null);
  const shown = Number.isFinite(value) ? value : 1;

  const setFromPress = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    const node = trackRef.current as (View & { getBoundingClientRect?: () => { left: number; width: number } }) | null;
    if (!node || !Number.isFinite(pageX)) return;

    if (typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const scrollX = typeof window === 'undefined' ? 0 : window.scrollX;
      const next = clamp((pageX - (rect.left + scrollX)) / rect.width);
      if (next != null) onChange(next);
      return;
    }

    node.measureInWindow((left, _top, width) => {
      const next = clamp((pageX - left) / width);
      if (next != null) onChange(next);
    });
  };

  const step = (delta: number) => {
    const next = clamp(shown + delta);
    if (next != null) onChange(next);
  };

  return (
    <View style={styles.group}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.value}>{muted ? '음소거' : `${Math.round(shown * 100)}%`}</Text>
      <Pressable ref={trackRef} style={styles.track} onPress={setFromPress}>
        <View pointerEvents="none" style={[styles.fill, muted && styles.fillMuted, { width: `${shown * 100}%` }]} />
      </Pressable>
      <View style={styles.stepRow}>
        <TouchableOpacity style={styles.step} onPress={() => step(-0.1)}>
          <Text style={styles.stepText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.step} onPress={() => step(0.1)}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EventVolumeModal({ volume, muted, onChange, onToggleMute, onClose, onExit }: Props) {
  const { eventWidth, eventHeight } = useLayout();
  const styles = useMemo(() => makeStyles(eventWidth, eventHeight), [eventWidth, eventHeight]);
  const [sfx, setSfx] = useState(getSfxVolume);

  useEffect(() => subscribeSfxVolume(setSfx), []);

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <VolumeSlider label="BGM" value={volume} muted={muted} onChange={onChange} styles={styles} />
        <VolumeSlider
          label="효과음"
          value={sfx}
          muted={muted}
          onChange={(next) => setSfx(setSfxVolume(next))}
          styles={styles}
        />

        <TouchableOpacity style={[styles.mute, muted && styles.muteOn]} onPress={onToggleMute}>
          <Text style={[styles.muteText, muted && styles.muteTextOn]}>{muted ? '음소거 해제' : '음소거'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>닫기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExit}>
          <Text style={styles.exitText}>이벤트 나가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (W: number, H: number) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(8, 16, 32, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 40,
    },
    card: {
      width: Math.min(W * 0.42, 420),
      backgroundColor: 'rgba(255,255,255,0.97)',
      borderRadius: 18,
      paddingVertical: H * 0.03,
      paddingHorizontal: W * 0.03,
      alignItems: 'center',
    },
    group: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
      fontSize: Math.max(18, Math.round(H * 0.028)),
      fontWeight: '700',
      color: '#243e5c',
    },
    value: {
      marginTop: 6,
      marginBottom: 10,
      fontSize: Math.max(16, Math.round(H * 0.024)),
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
    fillMuted: {
      backgroundColor: '#9aafc2',
    },
    stepRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
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
    mute: {
      marginTop: 8,
      minWidth: 140,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#e7f1fa',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    muteOn: {
      backgroundColor: '#d7e3ee',
    },
    muteText: {
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
      color: '#2d6ea8',
      fontSize: 16,
      fontWeight: '700',
    },
    muteTextOn: {
      color: '#5c7388',
    },
    close: {
      marginTop: 14,
      minWidth: 120,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2d6ea8',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    closeText: {
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
    exitText: {
      marginTop: 14,
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
      color: '#6a8298',
      fontSize: 14,
    },
  });
