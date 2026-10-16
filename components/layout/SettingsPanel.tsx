import React, { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import GeminiKeyField from './GeminiKeyField';
import { getBgmVolume, setBgmVolume, subscribeBgmVolume } from '@/services/bgmVolume';
import { getSfxVolume, setSfxVolume, subscribeSfxVolume } from '@/services/sfxVolume';
import { APP_LANGUAGES, setAppLanguage } from '@/services/appLanguage';
import { useI18n } from '@/i18n';

const clamp = (value: number) => {
  if (!Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
};

function VolumeControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const valueRef = useRef(value);
  const trackRef = useRef<View>(null);
  valueRef.current = value;

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

  return (
    <View style={styles.control}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{Math.round(value * 100)}%</Text>
      <Pressable ref={trackRef} style={styles.track} onPress={setFromPress}>
        <View pointerEvents="none" style={[styles.fill, { width: `${value * 100}%` }]} />
      </Pressable>
      <View style={styles.stepRow}>
        <TouchableOpacity style={styles.step} onPress={() => onChange(valueRef.current - 0.1)}>
          <Text style={styles.stepText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.step} onPress={() => onChange(valueRef.current + 0.1)}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsPanel({
  onOpenTutorial,
  onOpenTerms,
}: {
  onOpenTutorial: () => void;
  onOpenTerms: () => void;
}) {
  const { language, t } = useI18n();
  const [volume, setVolume] = useState(getBgmVolume);
  const [sfx, setSfx] = useState(getSfxVolume);
  const scrollRef = useRef<ScrollView>(null);
  const [keyOffset, setKeyOffset] = useState(0);

  useEffect(() => subscribeBgmVolume(setVolume), []);
  useEffect(() => subscribeSfxVolume(setSfx), []);

  const revealApiKey = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, keyOffset - 16), animated: true });
    }, 250);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <Text style={styles.title}>{t('settings')}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t('language')}</Text>
        <View style={styles.languageRow}>
          {APP_LANGUAGES.map((option) => (
            <TouchableOpacity
              key={option.code}
              style={[styles.languageButton, language === option.code && styles.languageButtonActive]}
              onPress={() => setAppLanguage(option.code)}
            >
              <Text style={[styles.languageButtonText, language === option.code && styles.languageButtonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('sound')}</Text>
        <VolumeControl label={t('bgm')} value={volume} onChange={(next) => setVolume(setBgmVolume(next))} />
        <VolumeControl label={t('sfx')} value={sfx} onChange={(next) => setSfx(setSfxVolume(next))} />
        <Text style={styles.hint}>{t('volumeHint')}</Text>
      </View>

      <View style={styles.keyWrap} onLayout={(event) => setKeyOffset(event.nativeEvent.layout.y)}>
        <GeminiKeyField onFocus={revealApiKey} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('guide')}</Text>
        <View style={styles.guideRow}>
          <TouchableOpacity style={styles.guideBtn} onPress={onOpenTutorial}>
            <Text style={styles.guideText}>{t('howToUse')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guideBtn} onPress={onOpenTerms}>
            <Text style={styles.guideText}>{t('terms')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f7f4f5',
    padding: 28,
    paddingBottom: 48,
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
  control: {
    marginBottom: 8,
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
  guideRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  guideBtn: {
    borderRadius: 12,
    backgroundColor: '#f6eef1',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  guideText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6d5360',
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6e0e8',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  languageButtonActive: {
    borderColor: '#4d8ec9',
    backgroundColor: '#e7f1fa',
  },
  languageButtonText: {
    color: '#56708b',
    fontSize: 14,
    fontWeight: '700',
  },
  languageButtonTextActive: {
    color: '#2d6ea8',
  },
});
