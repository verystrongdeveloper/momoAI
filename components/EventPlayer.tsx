// EventPlayer.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EventDialogue from './event/EventDialogue';
import EventSelection from './event/EventSelection';
import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';                         // 🔄

/* ---------- 타입 ---------- */
interface EventLine {
    type: 'dialogue' | 'selection' | 'narration' | 'command';
    character?: string;
    text: string;
    emotion?: string;
    bg?: string;
    music?: string;            // 🔄 배경음악 키
    options?: string[];
    commandType?: string;
    waitSecond?: number;
    soundFile?: string;        // (캐릭터 보이스)
}
interface EventPlayerProps { script: string; }

/* ---------- 리소스 ---------- */
const bgMap = {
    BG_AbydosCouncilRoom: require('../assets/images/background/BG_AbydosCouncilRoom.jpg'),
    BG_AbydosResidence: require('../assets/images/background/BG_AbydosResidence.jpg'),
    BG_AbydosRuinArea: require('../assets/images/background/BG_AbydosRuinArea.jpg'),
    BG_AbydosTrainStation: require('../assets/images/background/BG_AbydosTrainStation.jpg'),
    BG_AronaRoom: require('../assets/images/background/BG_AronaRoom.jpg'),
    BG_BambooForest: require('../assets/images/background/BG_BambooForest.jpg'),
    BG_Bank: require('../assets/images/background/BG_Bank.jpg'),
    BG_BeachFrontSide: require('../assets/images/background/BG_BeachFrontSide.jpg'),
};

const emotionMap = {
    hoshino_angry: require('../assets/images/hoshino/hoshino_angry.png'),
    hoshino_bigLaugh: require('../assets/images/hoshino/hoshino_bigLaugh.png'),
    hoshino_dontknowAnything: require('../assets/images/hoshino/hoshino_dontknowAnything.png'),
    hoshino_feelGood: require('../assets/images/hoshino/hoshino_feelGood.png'),
    hoshino_makebigEye: require('../assets/images/hoshino/hoshino_makebigEye.png'),
    hoshino_serious: require('../assets/images/hoshino/hoshino_serious.png'),
    hoshino_strongSurprised: require('../assets/images/hoshino/hoshino_strongSurprised.png'),
    hoshino_surprised: require('../assets/images/hoshino/hoshino_surprised.png'),
    hoshino_suspicious: require('../assets/images/hoshino/hoshino_suspicious.png'),
    hoshino_weakLaugh: require('../assets/images/hoshino/hoshino_weakLaugh.png'),
    hoshino_yawn: require('../assets/images/hoshino/hoshino_yawn.png'),
    hoshino_yawn2: require('../assets/images/hoshino/hoshino_yawn2.png'),
};

/* 🔄 배경 음악 리스트 (assets/music/) */
const musicMap: Record<string, any> = {
    'aira.mp3': require('../assets/music/aira.mp3'),
    'crossfire.mp3': require('../assets/music/crossfire.mp3'),
    'formless_dream.mp3': require('../assets/music/formless_dream.mp3'),
    'funky_road.mp3': require('../assets/music/funky_road.mp3'),
    'future_bossa.mp3': require('../assets/music/future_bossa.mp3'),
    'honey_jam.mp3': require('../assets/music/honey_jam.mp3'),
    'koi_is_love.mp3': require('../assets/music/koi_is_love.mp3'),
    'lovely_picnic.mp3': require('../assets/music/lovely_picnic.mp3'),
    'luminous_memory.mp3': require('../assets/music/luminous_memory.mp3'),
    'mechanical_jungle.mp3': require('../assets/music/mechanical_jungle.mp3'),
    'midnight_trip.mp3': require('../assets/music/midnight_trip.mp3'),
    'midsummer_cat.mp3': require('../assets/music/midsummer_cat.mp3'),
    'mischievous_step.mp3': require('../assets/music/mischievous_step.mp3'),
    'morose_dreamer.mp3': require('../assets/music/morose_dreamer.mp3'),
    'shady_girls.mp3': require('../assets/music/shady_girls.mp3'),
    'unwelcome_school.mp3': require('../assets/music/unwelcome_school.mp3'),
    'walkthrough.mp3': require('../assets/music/walkthrough.mp3'),
};

/* (캐릭터 보이스 – 그대로) */
const voiceMap: Record<string, any> = {
    'aint_it_nice.mp3': require('../assets/sound/hoshino/aint_it_nice.mp3'),
    'might_not_be_too_bad.mp3': require('../assets/sound/hoshino/might_not_be_too_bad.mp3'),
    "sensei_you're_weird_why_me.mp3": require('../assets/sound/hoshino/sensei_you\'re_weird_why_me.mp3'),
    'surprised_1.mp3': require('../assets/sound/hoshino/surprised_1.mp3'),
    'surprised_2.mp3': require('../assets/sound/hoshino/surprised_2.mp3'),
    'take_it_easy.mp3': require('../assets/sound/hoshino/take_it_easy.mp3'),
    'ugh_cant_be_bothered.mp3': require('../assets/sound/hoshino/ugh_cant_be_bothered.mp3'),
    'yo.mp3': require('../assets/sound/hoshino/yo.mp3'),
};

/* ---------- 크기 ---------- */
const { width: W, height: H } = Dimensions.get('window');

/* ==================================================================== */
const EventPlayer: React.FC<EventPlayerProps> = ({ script }) => {
    /* 상태 */
    const [lines, setLines] = useState<EventLine[]>([]);
    const [idx, setIdx] = useState(0);
    const [line, setLine] = useState<EventLine | null>(null);
    const [last, setLast] = useState<EventLine | null>(null);

    const [bg, setBg] = useState<string | null>(null);
    const [emo, setEmo] = useState<string | null>(null);
    const [mus, setMus] = useState<string | null>(null);          // 🔄 현재 BGM

    /* refs – 이전 값 기억 */
    const prevBg = useRef<string | null>(null);
    const prevEmo = useRef<string | null>(null);
    const prevMus = useRef<string | null>(null);

    /* 애니메이션 값 */
    const bgOpacity = useRef(new Animated.Value(1)).current;
    const emoOpacity = useRef(new Animated.Value(1)).current;

    /* 🔄 BGM 플레이어 */
    const bgmRef = useRef<Audio.Sound | null>(null);

    /* 파싱 */
    useEffect(() => {
        console.log('📜 전달된 스크립트:\n', script); // ✅ 추가된 로그
        const parsed = parse(script);
        setLines(parsed);
        setLine(parsed[0]);
    }, [script]);

    /* 프리로드 (배경 · 표정 · 음악 전부) */
    useEffect(() => {
        Asset.loadAsync([
            ...Object.values(bgMap),
            ...Object.values(emotionMap),
            ...Object.values(voiceMap),
            ...Object.values(musicMap),
        ]);
    }, []);

    /* 라인 반응 */
    useEffect(() => {
        if (!line) return;

        /* 대사·나레이션 → last 저장, 캐릭터 보이스 */
        if (line.type === 'dialogue' || line.type === 'narration') {
            setLast(line);
            if (line.type === 'dialogue' && line.soundFile) playOnce(line.soundFile);
        }

        /* 배경 / 표정 / 음악 */
        if (line.bg) setNewBg(line.bg);
        if (line.emotion) setNewEmo(line.emotion);
        if (line.music !== undefined) setNewMusic(line.music);  // 🔄

        /* 명령 처리 */
        if (line.type === 'command') {
            switch (line.commandType) {
                case 'waitSecond':
                    setTimeout(next, (line.waitSecond || 1) * 1000);
                    return;
                case 'deleteEmotion':
                    Animated.timing(emoOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
                        .start(() => {
                            setEmo(null);
                            prevEmo.current = null;
                            next();
                        });
                    return;
                case 'deleteAll':
                    Animated.parallel([
                        fadeOut(bgOpacity),
                        fadeOut(emoOpacity),
                    ]).start(() => {
                        setBg(null); prevBg.current = null;
                        setEmo(null); prevEmo.current = null;
                        setLast(null);
                        bgOpacity.setValue(1);
                        emoOpacity.setValue(1);
                        next();
                    });
                    return;
                case 'endEvent':
                    stopMusic();     // 🔄 이벤트 끝나면 음악도 종료
                    return;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [line]);

    /* 컴포넌트 unmount 시 음악 정리 */
    useEffect(() => {
        return () => {
            stopMusic();
        };
    }, []);



    /* ───────── helpers ───────── */
    const playOnce = async (key: string) => {
        const snd = new Audio.Sound();
        await snd.loadAsync(voiceMap[key]);
        await snd.playAsync();
    };

    const setNewBg = (key: string) => {
        if (prevBg.current === key) return;
        setBg(key);
        prevBg.current = key;
        bgOpacity.setValue(1);
    };

    const setNewEmo = (key: string) => {
        if (prevEmo.current === key) return;
        setEmo(key);
        prevEmo.current = key;
        emoOpacity.setValue(1);
    };

    /* 🔄 배경음악 컨트롤 */
    const setNewMusic = async (key: string) => {
        if (key === 'none' || key === '') {
            stopMusic();
            prevMus.current = null;
            setMus(null);
            return;
        }
        if (prevMus.current === key) return;

        stopMusic();                            // 기존 음악 정지
        const bgm = new Audio.Sound();
        try {
            await bgm.loadAsync(musicMap[key]);
            await bgm.setIsLoopingAsync(true);
            await bgm.playAsync();
            bgmRef.current = bgm;
            prevMus.current = key;
            setMus(key);
        } catch (e) { console.warn('BGM load error', e); }
    };

    const stopMusic = async () => {
        if (bgmRef.current) {
            await bgmRef.current.stopAsync();
            await bgmRef.current.unloadAsync();
            bgmRef.current = null;
        }
    };

    const fadeOut = (value: Animated.Value, d = 300) =>
        Animated.timing(value, { toValue: 0, duration: d, useNativeDriver: true });

    const next = () => {
        if (idx + 1 < lines.length) {
            setIdx(i => {
                const nextIdx = i + 1;
                setLine(lines[nextIdx]);
                return nextIdx;
            });

        }
    };

    /* 파서 – emotion/bg/music/voice 모두 인라인 파싱 */
    const parse = (raw: string): EventLine[] => {
        const out: EventLine[] = [];
        raw.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
            if (l.startsWith('타이틀')) return;

            if (l.startsWith('selection')) {
                const opts = [...l.matchAll(/\(\d+\)"(.*?)"/g)].map(m => m[1]);
                out.push({ type: 'selection', text: '', options: opts });
                return;
            }

            if (l.startsWith('narration')) {
                const txt = l.match(/narration\s*:\s*(.+?)(?:\[|$)/)?.[1].trim() || '';
                const bg = l.match(/bg\s*:\s*(BG_[\w]+\.jpg)/)?.[1]?.replace('.jpg', '');
                const mus = l.match(/music\s*:\s*([\w_-]+\.mp3|none)/)?.[1];
                out.push({ type: 'narration', character: '', text: txt, bg, music: mus });
                return;
            }

            if (/^(deleteAll|deleteEmotion|endEvent)/.test(l)) {
                out.push({ type: 'command', commandType: l.trim(), text: '' });
                return;
            }
            if (l.startsWith('waitSecond')) {
                const s = Number(l.replace(/[^\d]/g, '')) || 1;
                out.push({ type: 'command', commandType: 'waitSecond', waitSecond: s, text: '' });
                return;
            }

            /* 일반 대사 */
            const i = l.indexOf(':');
            if (i === -1) return;
            const spk = l.slice(0, i).trim();
            const rest = l.slice(i + 1).trim();
            const emo = rest.match(/emotion\s*:\s*([\w_]+\.png)/)?.[1]?.replace('.png', '');
            const bg = rest.match(/bg\s*:\s*(BG_[\w]+\.jpg)/)?.[1]?.replace('.jpg', '');
            const mus = rest.match(/music\s*:\s*([\w_-]+\.mp3|none)/)?.[1];
            const vce = rest.match(/sound\s*:\s*([\w'_.-]+\.mp3)/)?.[1];
            const txt = rest.replace(/\[.*?]/g, '').trim();
            out.push({ type: 'dialogue', character: spk, text: txt, emotion: emo, bg, music: mus, soundFile: vce });
        });
        return out;
    };

    /* ───────── render ───────── */
    return (
        <View style={styles.full}>
            {/* 배경 */}
            {bg && (
                <Animated.Image
                    source={bgMap[bg as keyof typeof bgMap]}
                    style={[styles.bg, { opacity: bgOpacity }]}
                />
            )}


            {/* 표정 (모든 캐릭터 이미지 유지) */}
            {Object.entries(emotionMap).map(([key, src]) => (
                <Animated.Image
                    key={key}
                    source={src}
                    style={[styles.char, { opacity: key === emo ? emoOpacity : 0 }]}
                    fadeDuration={0}
                />
            ))}

            {/* 텍스트 박스 */}
            <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.txtBox}>
                {line?.type === 'narration'
                    ? <EventDialogue character={line.character!} text={line.text} />
                    : last && <EventDialogue character={last.character!} text={last.text} />
                }
            </LinearGradient>

            {/* 선택지 */}
            {line?.type === 'selection' &&
                <View style={styles.sel}>
                    <EventSelection options={line.options || []} onSelect={next} />
                </View>}

            {/* 터치 영역 */}
            <TouchableOpacity style={styles.touch} onPress={next} />
        </View>
    );
};

/* ---------- style ---------- */
const styles = StyleSheet.create({
    full: { flex: 1, backgroundColor: '#000' },
    bg: { position: 'absolute', width: '100%', height: '100%' },
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
    txtBox: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: H / 3,
        paddingHorizontal: 30,
        paddingTop: 32,
        paddingBottom: 12,
        paddingLeft: 100,
        paddingRight: 100,
    },
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

export default EventPlayer;
