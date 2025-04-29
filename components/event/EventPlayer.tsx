import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Asset } from 'expo-asset';
import { sfxMap, bgMap, emotionMap, expressionMap } from '../constants/eventAssets';
import useEventParser from '../hooks/useEventParser';
import useBGM from '../hooks/useBGM';
import { EventLine } from '../types/EventLine';
import EventBackground from './EventBackground';
import CharacterSprite from './CharacterSprite';
import EventSelection from './EventSelection';
import TitleBanner from './TitleBanner';
import TextBox from './TextBox';
import { Audio } from 'expo-av';

const { width: W, height: H } = Dimensions.get('window');

interface Props { script: string; }

const EventPlayer: React.FC<Props> = ({ script }) => {
  console.log(script);
  /* ───────── 데이터 ───────── */
  const lines = useEventParser(script);
  const [idx, setIdx] = useState(0);
  const line = lines[idx] || null;
  const [last, setLast] = useState<EventLine | null>(null);

  /* ───────── 비주얼 상태 ───────── */
  const [title, setTitle] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [bg, setBg] = useState<string | null>(null);
  const [emo, setEmo] = useState<string | null>(null);
  const [animation, setAnimation] = useState<{
    type: 'shake' | 'slide';
    axis: 'x' | 'y';
    distance: number;
    duration: number;
    iterations?: number;
  } | null>(null);
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const emoOpacity = useRef(new Animated.Value(1)).current;

  /* ───────── BGM ───────── */
  const { setMusic, stop } = useBGM();

  /* ───────── 표현 ───────── */
  const [expression, setExpression] = useState<{
    image: any;
    visible: boolean;
    fadeAnim: Animated.Value;
  } | null>(null);

  /* ───────── 보이스 ───────── */
  const playSFX = async (key: string) => {
    const snd = new Audio.Sound();
    await snd.loadAsync(sfxMap[key]);
    await snd.playAsync();
  };

  /* ───────── 선로딩 ───────── */
  useEffect(() => {
    Asset.loadAsync([
      ...Object.values(bgMap),
      ...Object.values(emotionMap),
      ...Object.values(expressionMap),
      ...Object.values(sfxMap),
    ]);
  }, []);

  /* ───────── 라인 반응 ───────── */
  useEffect(() => {
    if (!line) return;

    // 타이틀 처리
    if (line.type === '타이틀') {
      setTitle(line.text || '');
      setShowTitle(true);
    
      // 3초간 보여주고 -> 페이드 아웃 후 → 1초 대기 후 nextLine
      setTimeout(() => {
        setShowTitle(false);
    
        // 여기서 1초 후 nextLine
        setTimeout(() => {
          nextLine();
        }, 1000); // ← 여기! 1초 딜레이
      }, 3000); // ← 타이틀 표시 시간
      return;
    }
    // 대사·나레이션
    if (line.type === 'dialogue' || line.type === 'narration') {
      setLast(line);
      if (line.soundFile) playSFX(line.soundFile);
    }

    // 비주얼
    if (line.bg) setBg(line.bg);
    if (line.emotion) setEmo(line.emotion);
    if (line.music !== undefined) setMusic(line.music);
    if (line.expression) {
      const expFadeAnim = new Animated.Value(0);

      const image = expressionMap[line.expression];

      if (image) {
        setExpression({ image, visible: true, fadeAnim: expFadeAnim });

        Animated.timing(expFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();


        setTimeout(() => {
          Animated.timing(expFadeAnim, {
            toValue: 0,
            duration: 300, //변경 가능
            useNativeDriver: true,
          }).start(() => {
            setExpression(null);
          });
        }, 2000);
      } else {
        console.warn('Expression 이미지 매핑 없음:', line.expression);
      }
    }

    // 애니메이션 처리
    if (line.type === 'animation' || (line.type === 'dialogue' && line.animationType)) {
      const animTypeRaw = line.animationType || '';

      const type = animTypeRaw.toLowerCase().includes('slide') ? 'slide' : 'shake';
      const axis = animTypeRaw.toLowerCase().includes('x') ? 'x' : 'y';

      console.log(`🎯 애니메이션 파싱됨: type=${type}, axis=${axis}`);

      const animation = {
        type,
        axis,
        distance: 15,
        duration: 80,
        iterations: 3,
      } as const;

      setAnimation(animation);

      setTimeout(() => {
        setAnimation(null);
      }, (animation.duration * (animation.iterations || 1) * 2) + 100);

      return;
    }





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
      <TitleBanner title={title || ''} visible={showTitle} />
      <EventBackground bgKey={bg} fadeAnim={bgOpacity} />
      <CharacterSprite
        current={emo}
        fadeAnim={emoOpacity}
        expression={expression}
        animation={animation}
      />
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
