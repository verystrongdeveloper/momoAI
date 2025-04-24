import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { voiceMap, bgMap, emotionMap } from '../constants/eventAssets';
import useEventParser from '../hooks/useEventParser';
import useBGM from '../hooks/useBGM';
import { EventLine } from '../types/EventLine';
import EventBackground from './EventBackground';
import CharacterSprite from './CharacterSprite';
import EventSelection from './EventSelection';
import TextBox from './TextBox';
import { Audio } from 'expo-av';

const { width: W, height: H } = Dimensions.get('window');

interface Props { script: string; }

const EventPlayer: React.FC<Props> = ({ script }) => {
  /* ───────── 데이터 ───────── */
  const lines = useEventParser(script);
  const [idx, setIdx] = useState(0);
  const line = lines[idx] || null;
  const [last, setLast] = useState<EventLine | null>(null);

  /* ───────── 비주얼 상태 ───────── */
  const [bg, setBg] = useState<string | null>(null);
  const [emo, setEmo] = useState<string | null>(null);
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const emoOpacity = useRef(new Animated.Value(1)).current;

  /* ───────── BGM ───────── */
  const { setMusic, stop } = useBGM();

  /* ───────── 보이스 ───────── */
  const playVoice = async (key: string) => {
    const snd = new Audio.Sound();
    await snd.loadAsync(voiceMap[key]);
    await snd.playAsync();
  };

  /* ───────── 선로딩 ───────── */
  useEffect(() => {
    Asset.loadAsync([
      ...Object.values(bgMap),
      ...Object.values(emotionMap),
      ...Object.values(voiceMap),
    ]);
  }, []);

  /* ───────── 라인 반응 ───────── */
  useEffect(() => {
    if (!line) return;

    // 대사·나레이션
    if (line.type === 'dialogue' || line.type === 'narration') {
      setLast(line);
      if (line.type === 'dialogue' && line.soundFile) playVoice(line.soundFile);
    }

    // 비주얼
    if (line.bg) setBg(line.bg);
    if (line.emotion) setEmo(line.emotion);
    if (line.music !== undefined) setMusic(line.music);

    // 명령
    const finish = () => nextLine();

    if (line.type === 'command') {
      switch (line.commandType) {
        case 'waitSecond':
          setTimeout(finish, (line.waitSecond || 1) * 1000);
          return;
        case 'deleteEmotion':
          Animated.timing(emoOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
            .start(() => { setEmo(null); finish(); });
          return;
        case 'deleteAll':
          Animated.parallel([
            Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(emoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start(() => {
            setBg(null); setEmo(null); setLast(null);
            bgOpacity.setValue(1); emoOpacity.setValue(1);
            finish();
          });
          return;
        case 'endEvent':
          stop();
          return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  /* 언마운트 시 BGM 정리 */
  useEffect(() => {
    // ① clean-up 래퍼로 감싸서 void 반환
    return () => { stop(); };   // ← 여기만 변경
    // 또는: return () => { void stop(); };
  }, [stop]);
  /* ───────── helpers ───────── */
  const nextLine = () => {
    if (idx + 1 < lines.length) setIdx(i => i + 1);
  };

  /* ───────── render ───────── */
  return (
    <View style={styles.full}>
      <EventBackground bgKey={bg} fadeAnim={bgOpacity} />
      <CharacterSprite current={emo} fadeAnim={emoOpacity} />
      <TextBox currentLine={line} lastSpoken={last} />

      {line?.type === 'selection' && (
        <View style={styles.sel}>
          <EventSelection options={line.options || []} onSelect={nextLine} />
        </View>
      )}

      <TouchableOpacity style={styles.touch} onPress={nextLine} />
    </View>
  );
};

export default EventPlayer;

/* ---------- style ---------- */
const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#000' },
  sel: {
    position: 'absolute',
    top: H * 0.4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  touch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
