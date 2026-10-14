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

const clamp = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null);

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

  const setFromPress = (event: GestureResponderEvent) => {
    const node = trackRef.current as (View & { getBoundingClientRect?: () => { left: number; width: number } }) | null;
    if (!node || !Number.isFinite(event.nativeEvent.pageX)) return;

    if (typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const scrollX = typeof window === 'undefined' ? 0 : window.scrollX;
      const next = clamp((event.nativeEvent.pageX - (rect.left + scrollX)) / rect.width);
      if (next != null) onChange(next);
      return;
    }

    node.measureInWindow((left, _top, width) => {
      const next = clamp((event.nativeEvent.pageX - left) / width);
      if (next != null) onChange(next);
    });
  };

  return (
    <View style={styles.group}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.value}>{muted ? '음소거' : `${Math.round(shown * 100)}%`}</Text>
      </View>
      <Pressable ref={trackRef} style={styles.track} onPress={setFromPress}>
        <View pointerEvents="none" style={[styles.fill, muted && styles.fillMuted, { width: `${shown * 100}%` }]} />
      </Pressable>
      <View style={styles.stepRow}>
        <TouchableOpacity style={styles.step} onPress={() => onChange(Math.max(0, shown - 0.1))}>
          <Text style={styles.stepText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.step} onPress={() => onChange(Math.min(1, shown + 0.1))}>
          <Text style={styles.stepText}>＋</Text>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>사운드 설정</Text>
            <Text style={styles.subheading}>배경 음악과 효과음 볼륨을 조절합니다.</Text>
          </View>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose} accessibilityLabel="닫기">
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity>
        </View>

        <VolumeSlider label="BGM" value={volume} muted={muted} onChange={onChange} styles={styles} />
        <VolumeSlider label="효과음" value={sfx} muted={muted} onChange={(next) => setSfx(setSfxVolume(next))} styles={styles} />

        <TouchableOpacity style={[styles.mute, muted && styles.muteOn]} onPress={onToggleMute}>
          <Text style={[styles.muteText, muted && styles.muteTextOn]}>{muted ? '음소거 해제' : '음소거'}</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exit} onPress={onExit}>
            <Text style={styles.exitText}>이벤트 나가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (W: number, H: number) =>
  StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: 'rgba(8, 16, 32, 0.56)',
      zIndex: 40,
    },
    card: {
      width: Math.min(W * 0.88, 440),
      maxWidth: '100%',
      padding: Math.max(18, Math.round(H * 0.028)),
      borderRadius: 22,
      backgroundColor: '#ffffff',
      shadowColor: '#000000',
      shadowOpacity: 0.22,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    heading: {
      color: '#243e5c',
      fontSize: Math.max(20, Math.round(H * 0.032)),
      fontWeight: '800',
    },
    subheading: {
      marginTop: 5,
      color: '#718093',
      fontSize: Math.max(12, Math.round(H * 0.018)),
    },
    closeIcon: {
      width: 34,
      height: 34,
      marginLeft: 12,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#edf2f6',
    },
    closeIconText: {
      color: '#58697b',
      fontSize: 25,
      lineHeight: 28,
      fontWeight: '500',
    },
    group: {
      marginBottom: 18,
    },
    sliderLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    title: {
      color: '#243e5c',
      fontSize: Math.max(16, Math.round(H * 0.024)),
      fontWeight: '800',
    },
    value: {
      color: '#3d6288',
      fontSize: Math.max(14, Math.round(H * 0.021)),
      fontWeight: '700',
    },
    track: {
      width: '100%',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: '#dce8f1',
    },
    fill: {
      height: '100%',
      borderRadius: 6,
      backgroundColor: '#4d8ec9',
    },
    fillMuted: {
      backgroundColor: '#9aafc2',
    },
    stepRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    step: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#eef4f8',
    },
    stepText: {
      color: '#2d6ea8',
      fontSize: 21,
      fontWeight: '800',
    },
    mute: {
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e8f1fa',
    },
    muteOn: {
      backgroundColor: '#d7e3ee',
    },
    muteText: {
      color: '#2d6ea8',
      fontSize: 16,
      fontWeight: '800',
    },
    muteTextOn: {
      color: '#5c7388',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    close: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2d6ea8',
    },
    closeText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },
    exit: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#d8e1ea',
      backgroundColor: '#f8fafc',
    },
    exitText: {
      color: '#56708b',
      fontSize: 14,
      fontWeight: '700',
    },
  });
