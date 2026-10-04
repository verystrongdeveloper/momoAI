import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { bgMap, emotionMap, expressionMap, sfxMap } from '@/constants/eventAssets';
import useBGM from '@/hooks/useBGM';
import useEventParser from '@/hooks/useEventParser';
import { useLayout } from '@/hooks/useLayout';
import { EventLine } from '@/types/EventLine';
import CharacterSprite, { SpriteAnimation } from './CharacterSprite';
import EventBackground from './EventBackground';
import EventHud from './EventHud';
import EventSelection from './EventSelection';
import TextBox from './TextBox';
import TitleBanner from './TitleBanner';

interface Props {
  script: string;
}

interface Expression {
  image: any;
  fadeAnim: Animated.Value;
}

const TITLE_SHOW_MS = 3000;
const TITLE_GAP_MS = 1000;
const EXPRESSION_SHOW_MS = 2000;

const AUTO_MS = 2800;

const EventPlayer: React.FC<Props> = ({ script }) => {
  const router = useRouter();
  const { eventWidth, eventHeight } = useLayout();
  const lines = useEventParser(script);
  const [idx, setIdx] = useState(0);
  const line = lines[idx] ?? null;
  const [last, setLast] = useState<EventLine | null>(null);
  const [auto, setAuto] = useState(false);

  const [title, setTitle] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const [bg, setBg] = useState<string | null>(null);
  const [emo, setEmo] = useState<string | null>(null);
  const [animation, setAnimation] = useState<SpriteAnimation | null>(null);
  const [expression, setExpression] = useState<Expression | null>(null);
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const emoOpacity = useRef(new Animated.Value(1)).current;

  const { setMusic, stop } = useBGM();

  const nextLine = () => {
    if (idx + 1 < lines.length) setIdx((i) => i + 1);
  };

  useEffect(() => {
    if (!auto) return;
    if (!line || line.type === 'selection' || line.type === '타이틀' || line.type === 'command') return;
    const t = setTimeout(nextLine, AUTO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, idx, line]);

  const playSFX = async (key: string) => {
    const src = sfxMap[key];
    if (!src) return;
    const snd = new Audio.Sound();
    await snd.loadAsync(src);
    await snd.playAsync();
  };

  /* 에셋 선로딩 */
  useEffect(() => {
    Asset.loadAsync([
      ...Object.values(bgMap),
      ...Object.values(emotionMap),
      ...Object.values(expressionMap),
      ...Object.values(sfxMap),
    ]);
  }, []);

  /* 언마운트 시 BGM 정리 */
  useEffect(() => () => void stop(), [stop]);

  /* 현재 라인 처리 */
  useEffect(() => {
    if (!line) return;

    if (line.type === '타이틀') {
      setTitle(line.text ?? '');
      setShowTitle(true);
      // 사용자가 중간에 탭해서 넘어가면 타이머를 정리해 한 줄을 건너뛰지 않도록 한다.
      let gap: ReturnType<typeof setTimeout> | undefined;
      const show = setTimeout(() => {
        setShowTitle(false);
        gap = setTimeout(nextLine, TITLE_GAP_MS);
      }, TITLE_SHOW_MS);
      return () => {
        clearTimeout(show);
        if (gap) clearTimeout(gap);
        setShowTitle(false);
      };
    }

    if (line.type === 'dialogue' || line.type === 'narration') {
      setLast(line);
      if (line.soundFile) playSFX(line.soundFile);
    }

    if (line.bg) setBg(line.bg);
    if (line.emotion) {
      setEmo(line.emotion);
      emoOpacity.setValue(1);
    }
    if (line.music !== undefined) setMusic(line.music);

    if (line.expression) {
      const image = expressionMap[line.expression];
      if (image) {
        const fadeAnim = new Animated.Value(0);
        setExpression({ image, fadeAnim });
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => {
          Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() =>
            setExpression(null),
          );
        }, EXPRESSION_SHOW_MS);
      } else {
        console.warn('[EventPlayer] expression 매핑 없음:', line.expression);
      }
    }

    if (line.type === 'animation' || (line.type === 'dialogue' && line.animationType)) {
      const raw = (line.animationType ?? '').toLowerCase();
      const anim: SpriteAnimation = {
        type: raw.includes('slide') ? 'slide' : 'shake',
        axis: raw.includes('x') ? 'x' : 'y',
        distance: 15,
        duration: 80,
        iterations: 3,
      };
      setAnimation(anim);
      setTimeout(() => setAnimation(null), anim.duration * anim.iterations * 2 + 100);
      return;
    }

    if (line.type === 'command') {
      switch (line.commandType) {
        case 'waitSecond':
          setTimeout(nextLine, (line.waitSecond ?? 1) * 1000);
          return;
        case 'deleteEmotion':
          Animated.timing(emoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setEmo(null);
            nextLine();
          });
          return;
        case 'deleteAll':
          Animated.parallel([
            Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(emoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start(() => {
            setBg(null);
            setEmo(null);
            setLast(null);
            bgOpacity.setValue(1);
            emoOpacity.setValue(1);
            nextLine();
          });
          return;
        case 'backgroundOnly':
          setTimeout(nextLine, 1000);
          return;
        case 'endEvent':
          stop();
          return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  return (
    <View style={styles.full}>
      <View style={[styles.stage, { width: eventWidth, height: eventHeight }]}>
        <TitleBanner title={title} visible={showTitle} />
        <EventBackground bgKey={bg} fadeAnim={bgOpacity} />
        <CharacterSprite
          current={emo ?? last?.emotion ?? line?.emotion ?? null}
          fadeAnim={emoOpacity}
          expression={expression}
          animation={animation}
        />
        {line?.type === 'selection' && <View style={styles.selectionDim} pointerEvents="none" />}
        <TextBox currentLine={line} lastSpoken={last} />
        <EventHud auto={auto} onToggleAuto={() => setAuto((v) => !v)} onMenu={() => router.replace('/')} />

        {line?.type === 'selection' && (
          <View style={styles.selection}>
            <EventSelection options={line.options ?? []} onSelect={nextLine} />
          </View>
        )}

        <TouchableOpacity style={styles.tap} onPress={nextLine} />
      </View>
    </View>
  );
};

export default EventPlayer;

const styles = StyleSheet.create({
  full: {
    flex: 1,
    backgroundColor: '#13243f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#091426',
  },
  selection: {
    position: 'absolute',
    top: '25.5%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 16,
  },
  selectionDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 13, 36, 0.24)',
    zIndex: 4,
  },
  tap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
