// EventPlayer.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EventDialogue from './event/EventDialogue';
import EventSelection from './event/EventSelection';
import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';


interface EventLine {
    type: 'dialogue' | 'selection' | 'narration' | 'command';
    character?: string;
    text: string;
    emotion?: string;
    bg?: string;
    options?: string[];
    commandType?: string;
    waitSecond?: number;
    soundFile?: string;
}

interface EventPlayerProps {
    script: string;
}

const bgMap: Record<string, any> = {
    'BG_AbydosCouncilRoom.jpg': require('../assets/images/background/BG_AbydosCouncilRoom.jpg'),
    'BG_AbydosResidence.jpg': require('../assets/images/background/BG_AbydosResidence.jpg'),
    'BG_AbydosRuinArea.jpg': require('../assets/images/background/BG_AbydosRuinArea.jpg'),
    'BG_AbydosTrainStation.jpg': require('../assets/images/background/BG_AbydosTrainStation.jpg'),
    'BG_AronaRoom.jpg': require('../assets/images/background/BG_AronaRoom.jpg'),
    'BG_BambooForest.jpg': require('../assets/images/background/BG_BambooForest.jpg'),
    'BG_Bank.jpg': require('../assets/images/background/BG_Bank.jpg'),
    'BG_BeachFrontSide.jpg': require('../assets/images/background/BG_BeachFrontSide.jpg'),
};

const emotionMap: Record<string, any> = {
    'hoshino_angry.png': require('../assets/images/hoshino/hoshino_angry.png'),
    'hoshino_bigLaugh.png': require('../assets/images/hoshino/hoshino_bigLaugh.png'),
    'hoshino_dontknowAnything.png': require('../assets/images/hoshino/hoshino_dontknowAnything.png'),
    'hoshino_feelGood.png': require('../assets/images/hoshino/hoshino_feelGood.png'),
    'hoshino_makebigEye.png': require('../assets/images/hoshino/hoshino_makebigEye.png'),
    'hoshino_serious.png': require('../assets/images/hoshino/hoshino_serious.png'),
    'hoshino_strongSurprised.png': require('../assets/images/hoshino/hoshino_strongSurprised.png'),
    'hoshino_surprised.png': require('../assets/images/hoshino/hoshino_surprised.png'),
    'hoshino_suspicious.png': require('../assets/images/hoshino/hoshino_suspicious.png'),
    'hoshino_weakLaugh.png': require('../assets/images/hoshino/hoshino_weakLaugh.png'),
    'hoshino_yawn.png': require('../assets/images/hoshino/hoshino_yawn.png'),
    'hoshino_yawn2.png': require('../assets/images/hoshino/hoshino_yawn2.png'),
};

const soundMap: Record<string, any> = {
    'aint_it_nice.mp3': require('../assets/sound/hoshino/aint_it_nice.mp3'),
    'might_not_be_too_bad.mp3': require('../assets/sound/hoshino/might_not_be_too_bad.mp3'),
    'sensei_you\'re_weird_why_me.mp3': require('../assets/sound/hoshino/sensei_you\'re_weird_why_me.mp3'),
    'surprised_1.mp3': require('../assets/sound/hoshino/surprised_1.mp3'),
    'surprised_2.mp3': require('../assets/sound/hoshino/surprised_2.mp3'),
    'take_it_easy.mp3': require('../assets/sound/hoshino/take_it_easy.mp3'),
    'ugh_cant_be_bothered.mp3': require('../assets/sound/hoshino/ugh_cant_be_bothered.mp3'),
    'yo.mp3': require('../assets/sound/hoshino/yo.mp3'),
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const EventPlayer: React.FC<EventPlayerProps> = ({ script }) => {
    const [lines, setLines] = useState<EventLine[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentLine, setCurrentLine] = useState<EventLine | null>(null);
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const [lastDialogue, setLastDialogue] = useState<EventLine | null>(null);
    const [currentBg, setCurrentBg] = useState<string | null>(null);

    useEffect(() => {
        const parsed = parseScript(script);
        setLines(parsed);
        setCurrentLine(parsed[0]);
    }, [script]);

    useEffect(() => {
        const assets = [
            ...Object.values(bgMap),
            ...Object.values(emotionMap),
            ...Object.values(soundMap),
        ];
        Asset.loadAsync(assets);
    }, []);

    useEffect(() => {
        if (!currentLine) return;



        // ◼︎ dialogue일 때만 lastDialogue 업데이트
        if (currentLine.type === 'dialogue') {
            setLastDialogue(currentLine);

            if (currentLine.soundFile) {
                (async () => {
                    const sound = new Audio.Sound();
                    await sound.loadAsync(soundMap[currentLine.soundFile!]);
                    await sound.playAsync();
                })();
            }
        }

        // background / emotion 처리
        if (currentLine.emotion) setCurrentEmotion(currentLine.emotion);
        if (currentLine.bg) setCurrentBg(currentLine.bg);

        // command 처리 (waitSecond / deleteAll)
        if (currentLine.type === 'command' && currentLine.commandType === 'waitSecond') {
            const delay = (currentLine.waitSecond || 1) * 1000;
            const timeout = setTimeout(() => handleNext(), delay);
            return () => clearTimeout(timeout);
        }
        if (currentLine.type === 'command' && currentLine.commandType === 'deleteAll') {
            setCurrentEmotion(null);
            setCurrentBg(null);
            setLastDialogue(null);
            handleNext();
        }
    }, [currentLine]);

    const parseScript = (raw: string): EventLine[] => {
        const parsed: EventLine[] = [];
        const rawLines = raw.split('\n').map(l => l.trim()).filter(Boolean);

        for (const line of rawLines) {
            if (line.startsWith('타이틀')) continue;

            if (line.startsWith('selection')) {
                const opts = [...line.matchAll(/\(\d+\)"(.*?)"/g)].map(m => m[1]);
                parsed.push({ type: 'selection', text: '', options: opts });
                continue;
            }

            if (line.startsWith('narration')) {
                const text = (line.match(/narration\s*:\s*(.+?)(?:\[|$)/)?.[1] || '').trim();
                const bg = line.match(/bg\s*:\s*([\w\-.]+\.(?:jpg|png))/)?.[1];
                parsed.push({ type: 'narration', character: '', text, bg });
                continue;
            }

            if (/^(deleteAll|deleteEmotion|endEvent)/.test(line)) {
                parsed.push({ type: 'command', text: '', commandType: line.trim() });
                continue;
            }

            if (line.startsWith('waitSecond')) {
                const sec = Number(line.replace(/[^\d]/g, '')) || 1;
                parsed.push({ type: 'command', text: '', commandType: 'waitSecond', waitSecond: sec });
                continue;
            }

            const firstColon = line.indexOf(':');
            if (firstColon === -1) continue;

            const speaker = line.slice(0, firstColon).trim();
            const rest = line.slice(firstColon + 1).trim();

            const emotion = rest.match(/emotion\s*:\s*([\w\-.]+\.(?:png|jpg))/)?.[1];
            const bg = rest.match(/bg\s*:\s*([\w\-.]+\.(?:jpg|png))/)?.[1];
            const clean = rest.replace(/\[.*?\]/g, '').trim();

            const soundMatch = rest.match(/sound\s*:\s*([\w\-.]+\.mp3)/);
            const soundFile = soundMatch ? soundMatch[1] : undefined;

            parsed.push({
                type: 'dialogue',
                character: speaker,
                text: clean,
                emotion,
                bg,
                soundFile,
            });
        }
        return parsed;
    };

    const handleNext = () => {
        if (currentIndex + 1 < lines.length) {
            setCurrentIndex(currentIndex + 1);
            setCurrentLine(lines[currentIndex + 1]);
        }
    };

    return (
        <View style={styles.fullScreen}>
            {currentBg && <Image source={bgMap[currentBg]} style={styles.bgImage} />}
            {Object.entries(emotionMap).map(([key, src]) => (
                <Image
                    key={key}
                    source={src}
                    fadeDuration={0}
                    style={[
                        styles.characterImage,
                        { opacity: key === currentEmotion ? 1 : 0 }, // 현재 표정만 보이게
                    ]}
                />
            ))}


            {/* ◼︎ 하단 텍스트 박스: dialogue 또는 selection 시에도 lastDialogue를 계속 보여줌 */}
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.0)']}
                style={styles.textBox}
            >
                {currentLine?.type === 'narration' ? (
                    // 나레이션일 땐 parseScript에서 넣어준 character ("나레이션")를 함께 넘깁니다.
                    <EventDialogue
                        character={currentLine.character!}
                        text={currentLine.text}
                    />
                ) : (
                    // 일반 대화일 땐 마지막 대화(lastDialogue) 보여주기
                    lastDialogue &&
                    lastDialogue.character && (
                        <EventDialogue
                            character={lastDialogue.character}
                            text={lastDialogue.text}
                        />
                    )
                )}
            </LinearGradient>


            {/* ◼︎ selection일 때만 화면 중앙에 오버레이 */}
            {currentLine?.type === 'selection' && (
                <View style={styles.selectionOverlay}>
                    <EventSelection
                        options={currentLine.options || []}
                        onSelect={handleNext}
                    />
                </View>
            )}

            {/* ◼︎ 전체 터치 영역은 뒤로 빼두어야 선택지 버튼이 눌림 */}
            <TouchableOpacity style={styles.nextArea} onPress={handleNext} />
        </View>
    );
};

export default EventPlayer;

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    bgImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    characterImage: {
        position: 'absolute',
        bottom: SCREEN_H * -0.15,
        left: SCREEN_W * 0.48,
        width: SCREEN_W * 0.7,
        height: SCREEN_H * 0.9,
        transform: [{ translateX: -(SCREEN_W * 0.7) / 2 }],
        resizeMode: 'contain',
        pointerEvents: 'none',
    },
    textBox: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: SCREEN_H / 3,
        paddingHorizontal: 30,
        paddingTop: 32,
        paddingBottom: 12,
        justifyContent: 'flex-start',
        paddingLeft: 100,
        paddingRight: 100,
    },
    // ◼︎ 선택지 중앙 오버레이 스타일
    selectionOverlay: {
        position: 'absolute',
        top: SCREEN_H * 0.4,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    narrationText: {
        fontSize: 25,
        color: '#cccccc',
        fontStyle: 'italic',
    },
    dialogueText: {
        fontSize: 18,
        color: '#ffffff',
        lineHeight: 28,
    },
    nextArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});
