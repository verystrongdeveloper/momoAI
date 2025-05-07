# 📦 프론트엔드 프로젝트 코드 문서

## 📄 `components/CharacterChat.tsx`

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { TextInput as RNTextInput, View, Text, Button, FlatList, StyleSheet, Image } from 'react-native';

import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface CharacterChatProps {
    characterName: string;
    characterImage: any;
    setGlobalLoading?: (value: boolean) => void;
}

interface Chat {
    sender: 'user' | 'character' | 'typing';
    text: string;
    showImage?: boolean;
}

const CharacterChat: React.FC<CharacterChatProps> = ({
    characterName,
    characterImage,
    setGlobalLoading,
}) => {
    const [messages, setMessages] = useState<Chat[]>([]);
    const [input, setInput] = useState('');
    const [eventReady, setEventReady] = useState(false);
    const router = useRouter();

    const inputRef = useRef<RNTextInput>(null);
    const listRef = useRef<FlatList<Chat>>(null);           // ★ 리스트 ref

    /* ------------------------------------------------------------------ */
    /* 1. 메시지가 바뀔 때마다 리스트의 끝으로 스크롤 -------------------- */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        // setState가 반영된 뒤 한 프레임 정도 늦게 스크롤해야
        // 아이템 생성 → 레이아웃 계산 → 스크롤 순서가 꼬이지 않습니다.
        const timeout = setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 99999, animated: true });
        }, 50);                                             // ★ 50ms 딜레이
        return () => clearTimeout(timeout);
    }, [messages]);
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        const tryTrigger = async () => {
            if (Math.random() < 0.5) {
                // 1) 일단 타이핑 표시
                setMessages(prev => [...prev, { sender: 'typing', text: '···', showImage: true }]);
    
                try {
                    const res = await fetch('http://localhost:3000/api/trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ character: characterName }),
                    });
                    const data = await res.json();
    
                    // 2) 잠시 기다림
                    await new Promise(resolve => setTimeout(resolve, 1500));
    
                    const sentences = (data.triggerLine as string)
                        ?.split(/(?<=[.!?])\s+(?=\S)/g)
                        .map((s: string) => s.replace(/\n/g, ' ').trim())
                        .filter((s: string) => s !== '' && !/^(\.){2,}$/.test(s));
    
                    if (sentences && sentences.length > 0) {
                        // 3) 첫 문장 표시
                        setMessages(prev =>
                            prev.filter(m => m.sender !== 'typing')
                                .concat({ sender: 'character', text: sentences[0], showImage: true }),
                        );
    
                        // 4) 나머지 문장 출력
                        for (let i = 1; i < sentences.length; i++) {
                            setMessages(prev => [...prev, { sender: 'typing', text: '···' }]);
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            setMessages(prev =>
                                prev
                                    .filter(m => m.sender !== 'typing')
                                    .concat({ sender: 'character', text: sentences[i] }),
                            );
                        }
                    } else {
                        // ✨ triggerLine이 없을 경우 → 그냥 ... 제거
                        setMessages(prev => prev.filter(m => m.sender !== 'typing'));
                    }
    
                } catch (e) {
                    console.error('트리거 대사 로딩 실패:', e);
                    // 에러일 경우도 동일하게 타이핑 제거
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    setMessages(prev => prev.filter(m => m.sender !== 'typing'));
                }
            }
        };
    
        tryTrigger();
    }, []);
    



    const sendToGemini = async (
        msg: string,
    ): Promise<{ reply: string; eventReady: boolean }> => {
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ character: characterName, message: msg }),
        });
        return await res.json();
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Chat = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const userInput = input;
        setInput('');

        try {
            const { reply, eventReady: isEventReady } = await sendToGemini(userInput);

            const sentences = reply
                .split(/(?<=[.!?])\s+(?=\S)/g)
                .map(s => s.replace(/\n/g, ' ').trim())
                .filter(s => s !== '' && !/^(\.){2,}$/.test(s));

            if (sentences.length > 0) {
                setMessages(prev => [
                    ...prev,
                    { sender: 'character', text: sentences[0], showImage: true },
                ]);

                for (let i = 1; i < sentences.length; i++) {
                    setMessages(prev => [...prev, { sender: 'typing', text: '···' }]);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    setMessages(prev =>
                        prev
                            .filter(m => m.sender !== 'typing')
                            .concat({ sender: 'character', text: sentences[i] }),
                    );
                }

                setEventReady(isEventReady);
            }
        } catch (err) {
            console.error('[CharacterChat] fetch error:', err);
            setMessages(prev => [...prev, { sender: 'character', text: '에러가 발생했어요.' }]);
        }
    };

    const handleEventStart = async () => {
        setGlobalLoading?.(true);
        try {
            const res = await fetch('http://localhost:3000/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character: characterName,
                    dialogHistory: extractDialogHistory(messages),
                }),
            });
            const data = await res.json();

            router.push({
                pathname: '/event-screen',
                params: { script: data.eventScript },
            });
        } catch (e) {
            console.error('이벤트 로딩 실패:', e);
        } finally {
            setGlobalLoading?.(false);
        }
    };

    const extractDialogHistory = (allMsgs: Chat[]) => {
        const history: { user: string; ai: string }[] = [];
        let lastSender: 'user' | 'character' | null = null;
        let currentPair: Partial<{ user: string; ai: string }> = {};

        for (const msg of allMsgs) {
            if (msg.sender === 'user') {
                if (lastSender === 'character' && currentPair.ai) {
                    // 캐릭터가 먼저 보낸 경우
                    currentPair.user = msg.text;
                    history.push(currentPair as { user: string; ai: string });
                    currentPair = {};
                } else {
                    currentPair = { user: msg.text };
                }
                lastSender = 'user';
            } else if (msg.sender === 'character') {
                if (lastSender === 'user' && currentPair.user) {
                    // 유저가 먼저 보낸 경우
                    currentPair.ai = msg.text;
                    history.push(currentPair as { user: string; ai: string });
                    currentPair = {};
                } else {
                    currentPair = { ai: msg.text };
                }
                lastSender = 'character';
            }
        }

        return history.slice(-3);
    };


    const renderItem = ({ item }: { item: Chat }) => {
        const isUser = item.sender === 'user';
        const isTyping = item.sender === 'typing';
    
        return (
            <View style={[styles.messageRow, isUser ? styles.right : styles.left]}>
                {!isUser && (
                    <View style={styles.avatarWrapper}>
                        {item.showImage ? (
                            <Image source={characterImage} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder} />
                        )}
                    </View>
                )}
                <View style={styles.messageColumn}>
                    {!isUser && item.showImage && (
                        <Text style={styles.charName}>{characterName}</Text>
                    )}
                    <Text
                        style={[
                            styles.bubble,
                            isUser ? styles.userBubble : styles.charBubble,
                            isTyping && styles.typingBubble,
                        ]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };
    

    return (
        <View style={styles.chatContainer}>
            <FlatList
                ref={listRef}                               // ★ ref 연결
                data={messages}
                keyExtractor={(_, i) => i.toString()}
                renderItem={renderItem}
                style={styles.chatList}
                scrollEventThrottle={16}
            />

            {eventReady && (
                <View style={styles.eventContainer}>
                    <Text style={styles.eventLabel}>| 인연 이벤트 |</Text>
                    <TouchableOpacity style={styles.eventButton} onPress={handleEventStart}>
                        <Text style={styles.eventButtonText}>
                            {characterName}의 인연 스토리로.
                        </Text>
                    </TouchableOpacity>
                </View>
            )}



            <View style={styles.inputArea}>
                <RNTextInput
                    ref={inputRef}                           // ★ 포커스 유지용 ref
                    style={styles.input}
                    placeholder="메시지를 입력하세요"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={() => {
                        handleSend();
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                />
                <Button title="보내기" onPress={handleSend} />
            </View>
        </View>
    );
};

export default CharacterChat;

/* ------------------------------------------------------------------ */
/*                              스타일 시트                           */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    chatList: {
        flex: 1,
        padding: 10,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-start',
    },
    messageColumn: {
        flexShrink: 1,
    },
    left: {
        alignSelf: 'flex-start',
    },
    right: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    bubble: {
        padding: 10,
        borderRadius: 12,
        flexWrap: 'wrap',
        fontSize: 40,
        
    },
    avatarWrapper: {
        width: 42,                  // 아바타 공간 고정
        alignItems: 'center',
        marginRight: 6,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: 'transparent',
    },
    userBubble: {
        backgroundColor: '#DCF8C6',
    },
    charBubble: {
        backgroundColor: '#44546A',
        color: 'white',
        maxWidth: 700, 
    },
    typingBubble: {
        fontFamily: 'monospace',
        letterSpacing: 2,
        fontSize: 30,
    },
    inputArea: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 6,
        paddingHorizontal: 10,
        marginRight: 8,
    },
    charName: {
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 2,
        fontSize: 40,
    },
    eventContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    eventLabel: {
        color: '#888',
        fontSize: 20,
        marginBottom: 4,
    },
    eventButton: {
        backgroundColor: '#F48FB1',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    eventButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 35,

    },

});

```

## 📄 `components/ChatEntry.tsx`

```tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface ChatEntryProps {
  image: any;
  name: string;
  status: string;
  onSelect: () => void;
}

const ChatEntry: React.FC<ChatEntryProps> = ({ image, name, status, onSelect }) => {
  return (
    <TouchableOpacity onPress={onSelect}>
      <View style={styles.chatEntry}>
        <Image source={image} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChatEntry;

const styles = StyleSheet.create({
  chatEntry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 5,
    resizeMode: 'cover',
  },
  name: {
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
});

```

## 📄 `components/ChatTitle.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatTitle: React.FC = () => {
  return (
    <View style={styles.chatTitle}>
      <Text style={styles.titleText}>학생 (5)</Text>
      <View style={styles.menuIcons}>
        <Text style={styles.icon}>≡</Text>
        <Text style={styles.icon}>인연랭크</Text>
      </View>
    </View>
  );
};

export default ChatTitle;

const styles = StyleSheet.create({
  chatTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuIcons: {
    flexDirection: 'row',
    gap: 5,
  },
  icon: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 14,
  },
});

```

## 📄 `components/MomoChatList.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CharacterChat from './CharacterChat';

interface Character {
  name: string;
  image: any; // require('../assets/images/xxx.jpg') 형태
}

const MomoChatList: React.FC<{ selectedCharacter: Character | null; setGlobalLoading?: (value: boolean) => void; }> = ({ selectedCharacter, setGlobalLoading }) => {
  return (
    <View style={styles.chatContainer}>
      {selectedCharacter ? (
        <>
          <CharacterChat
            characterName={selectedCharacter.name}
            characterImage={selectedCharacter.image}
            setGlobalLoading={setGlobalLoading}
          />
        </>
      ) : (
        <></> // 선택 안 했을 때는 그냥 빈 상태로
      )}
    </View>
  );
};

export default MomoChatList;

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  notice: {
    flex: 1,
    padding: 20,
    color: '#999',
    fontSize: 16,
  },
});

```

## 📄 `components/MomoContainer.tsx`

```tsx
// MomoContainer.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MomoHeader from './MomoHeader';
import MomoSidebar from './MomoSidebar';
import MomoChatList from './MomoChatList';
import ChatEntry from './ChatEntry';

interface Character {
  name: string;
  status: string;
  image: any;
}

const characters = [
  {
    name: '시로코',
    status: '싸이클링 파티 모집 중…(1/5)',
    image: require('../assets/images/shiroko.jpg'),
  },
  {
    name: '호시노',
    status: '낮잠 중 방해금지',
    image: require('../assets/images/hoshino.jpg'),
  },
  {
    name: '세리카',
    status: '대책위원회 쿠로미 세리카입니다',
    image: require('../assets/images/serika.jpg'),
  },
  {
    name: '노노미',
    status: '즐거운 하루 되세요!',
    image: require('../assets/images/nonomi.jpg'),
  },
  {
    name: '아야네',
    status: '상식이 존중받는 동아리, 대책...',
    image: require('../assets/images/ayane.jpg'),
  },
  {
    name: '히나',
    status: '',
    image: require('../assets/images/hina.jpg'), // 이미지 경로 추가 필요
  },
  {
    name: '이부키',
    status: '게헨나 학원의 이부키입니다!',
    image: require('../assets/images/ibuki.jpg'), 
  },
];



const MomoContainer: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false); // ✅ 전역 로딩 상태 추가

  return (
    <View style={styles.container}>
      <MomoHeader />
      <View style={styles.body}>
        <MomoSidebar />

        {/* 왼쪽: 캐릭터 리스트 */}
        <View style={styles.chatList}>
          {characters.map((char) => (
            <ChatEntry
              key={char.name}
              image={char.image}
              name={char.name}
              status={char.status}
              onSelect={() => setSelectedCharacter(char)}
            />
          ))}
        </View>

        {/* 오른쪽: 선택된 캐릭터의 채팅 */}
        <MomoChatList
          selectedCharacter={selectedCharacter}
          setGlobalLoading={setGlobalLoading} // ✅ 전달
        />
      </View>

      {/* ✅ 전역 로딩 오버레이 */}
      {globalLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default MomoContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FB94A7',
    marginVertical: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  chatList: {
    width: '40%',
    padding: 10,
    backgroundColor: '#f4f7f8',
  },
  // ✅ 로딩 오버레이 스타일
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

```

## 📄 `components/MomoHeader.tsx`

```tsx
import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

const MomoHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrapper}>
        <Image source={require('../assets/images/logo.jpg')} style={styles.logo} />
      </View>

      <TouchableOpacity>
        <Text style={styles.closeBtn}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MomoHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FB94A7',
  },

  logoWrapper: {
    flex: 1,
    alignItems: 'flex-start', // 왼쪽 정렬
  },

  logo: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 5,
  },

  closeBtn: {
    fontSize: 28,
    color: 'white',
  },

});

```

## 📄 `components/MomoSidebar.tsx`

```tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const MomoSidebar: React.FC = () => {
  return (
    <View style={styles.sidebar}>
      <Image source={require('../assets/images/list.jpg')} style={styles.icon} />
      <Image source={require('../assets/images/message.jpg')} style={styles.icon} />
    </View>
  );
};

export default MomoSidebar;

const styles = StyleSheet.create({
  sidebar: {
    width: 60,
    backgroundColor: '#4C5B70',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 5,
  },
});

```

## 📄 `components/event/CharacterSprite.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { emotionMap } from '../constants/eventAssets';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  /** 현재 표시할 emotion 키(
   *  ex. 'hina_surprised.png') – 없으면 null */
  current: string | null;
  /** 페이드 인·아웃용 opacity */
  fadeAnim: Animated.Value;
  /** 캐릭터 위 이모션 버블 */
  expression?: {
    image: any;
    visible: boolean;
    fadeAnim: Animated.Value;
  } | null;
  /** shake / slide 애니메이션 정보  */
  animation?: {
    type: 'shake' | 'slide'; // 흔들기 or 미끄러지기
    axis: 'x' | 'y';         // 움직일 축
    distance: number;        // 한 번 이동 픽셀
    duration: number;        // 한 번에 걸릴 시간(ms)
    iterations?: number;     // shake 반복 횟수
  } | null;
}

/*  ──────────────────────────────────────────
    ■ 변경 핵심
    1) translateAnim → Animated.ValueXY 로 변경
    2) 모든 emotion·expression 을 감싸는
       Animated.View 를 만든 뒤 거기에 transform 적용
    이렇게 하면 “스프라이트 전체” 가 통째로 이동합니다.
   ────────────────────────────────────────── */
export default function CharacterSprite({
  current,
  fadeAnim,
  expression,
  animation,
}: Props) {
  // XY 좌표를 동시에 다루기 위해 ValueXY 사용
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  /* animation prop 이 바뀔 때마다 실행 */
  useEffect(() => {
    if (!animation) {
      // 애니메이션이 끝나면 위치 초기화
      translate.setValue({ x: 0, y: 0 });
      return;
    }

    const { type, axis, distance, duration, iterations = 1 } = animation;

    /** 특정 축만 왕복 이동하는 helper */
    const oneCycle = (dist: number) =>
      Animated.timing(translate, {
        toValue: axis === 'x' ? { x: dist, y: 0 } : { x: 0, y: dist },
        duration,
        useNativeDriver: true,
      });

    const backToZero = Animated.timing(translate, {
      toValue: { x: 0, y: 0 },
      duration,
      useNativeDriver: true,
    });

    const seq: Animated.CompositeAnimation[] = [];

    if (type === 'shake') {
      // shake: ( +dist → -dist ) n회
      for (let i = 0; i < iterations; i++) {
        seq.push(oneCycle(distance), oneCycle(-distance));
      }
      seq.push(backToZero);
    } else if (type === 'slide') {
      // slide: ( +dist → 0 ) 1회
      seq.push(oneCycle(distance), backToZero);
    }

    Animated.sequence(seq).start();
  }, [animation, translate]);

  /* ───────── style helpers ───────── */
  const charStyle = (key: string) => [
    styles.char,
    { opacity: key === current ? fadeAnim : 0 },
  ];

  const containerStyle = [
    styles.container,
    {
      transform: [
        { translateX: translate.x },
        { translateY: translate.y },
      ],
    },
  ];

  /* ───────── render ───────── */
  return (
    <Animated.View style={containerStyle} pointerEvents="none">
      {/* 감정 스프라이트들 (opacity 로 토글) */}
      {Object.entries(emotionMap).map(([key, src]) => (
        <Animated.Image
          key={key}
          source={src}
          style={charStyle(key)}
          fadeDuration={0}
        />
      ))}

      {/* 이모션 버블 */}
      {expression && (
        <Animated.Image
          source={expression.image}
          style={[styles.expression, { opacity: expression.fadeAnim }]}
          fadeDuration={0}
        />
      )}
    </Animated.View>
  );
}

/* ───────── style ───────── */
const styles = StyleSheet.create({
  /* 스프라이트 전체 컨테이너 */
  container: {
    position: 'absolute',
    bottom: -200,       // 원본 위치 (필요하면 조절)
    left: '10%',
    width: W * 0.7,
    aspectRatio: 2000 / 1200,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  /* 각 emotion PNG */
  char: {
    left: 100,
    width: '110%',
    height: '120%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  
  /* 이모션 버블 위치 (캐릭터 왼쪽 위) */
  expression: {
    position: 'absolute',
    top: H * 0.02,      // 캐릭터 상단 기준 위치
    left: W * 0.35,     // 캐릭터 왼쪽 기준 위치
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});

```

## 📄 `components/event/EventBackground.tsx`

```tsx
import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { bgMap } from '../constants/eventAssets';

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
    />
  );
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', width: '100%', height: '100%' },
});

```

## 📄 `components/event/EventDialogue.tsx`

```tsx
import React, { useLayoutEffect, useEffect, useState } from 'react';   // ← useLayoutEffect 추가
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  character: string;
  text: string;
}

const EventDialogue: React.FC<Props> = ({ character, text }) => {
  /* 캐릭터 이름·소속 분리 ------------------------------------------------ */
  const parseCharacterName = (character: string) => {
    if (character === '???') {
      return { name: '???', affiliation: '' }; // 또는 '???'에 특별한 스타일 적용
    }
    const match = character.match(/^(.*?)\((.*?)\)$/);
    return match
      ? { name: match[1], affiliation: match[2] }
      : { name: character, affiliation: '' };
  };
  const { name, affiliation } = parseCharacterName(character);

  /* 타이핑 애니메이션용 상태 -------------------------------------------- */
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  /* 🔸 text가 바뀌면 먼저 상태를 0으로 초기화 – 화면 그리기 전에 실행 */
  useLayoutEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);                              // ← useEffect ➜ useLayoutEffect 로 변경

  /* 글자 하나씩 찍어주기 -------------------------------------------------- */
  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(index + 1);
      }, 30);                              // 글자 간 간격(ms)
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  /* ---------------------------------------------------------------------- */
  return (
    <View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.affiliation}>{affiliation}</Text>
      <Text style={styles.text}>{displayedText}</Text>
    </View>
  );
};

export default EventDialogue;

/* ------------------------------ 스타일 ---------------------------------- */
const styles = StyleSheet.create({
  name: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  affiliation: {
    fontSize: 40,
    color: '#8fd3ff',
    marginBottom: 12,
    borderBottomColor: '#ffffff',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  text: {
    fontSize: 55,
    color: '#ffffff',
    lineHeight: 60,
  },
});

```

## 📄 `components/event/EventPlayer.tsx`

```tsx
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
  console.log(JSON.stringify(lines, null, 2));
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
    if (line.emotion) {
      setEmo(line.emotion);
      emoOpacity.setValue(1); // ✅ 다시 보이게 만들기
    }
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
            duration: 500, //변경 가능
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
    if (line.type === 'command' && line.commandType === 'backgroundOnly') {
      if (line.bg) setBg(line.bg);
      if (line.music !== undefined) setMusic(line.music);
      setTimeout(() => nextLine(), 1000);
      return;
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
    top: '50%',               // 화면 세로의 50%
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -40 }],  // 요소 높이의 절반 (예: 80px인 경우 -40)
    zIndex: 10,
  },
  
  
  touch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  
});

```

## 📄 `components/event/EventSelection.tsx`

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';

interface Props {
  options: string[];
  onSelect: (option: string) => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

const EventSelection: React.FC<Props> = ({ options, onSelect }) => {
  return (
    <View style={styles.container}>
      {options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.btn}
          onPress={() => onSelect(opt)}
        >
          <ImageBackground
            source={require('../../assets/ui/selection_bg.png')}
            resizeMode="stretch"
            style={styles.btnBg}
          >
            <Text style={styles.text}>{opt}</Text>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EventSelection;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  btn: {
    width: '80%',           // 🔥 가로폭을 넓게 (기존 80% → 85%)
    height: 70,             // 🔥 높이 키우기 (기존 60 → 70)
    marginVertical: 10,     // 🔥 선택지 간 간격 조금 키우기
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnBg: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#334877',         // 🔥 선택지 텍스트 색감 조금 더 선명하게
    textAlign: 'center',
  },
  
});

```

## 📄 `components/event/TextBox.tsx`

```tsx
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Dimensions } from 'react-native';
import EventDialogue from './EventDialogue';
import { EventLine } from '../types/EventLine';

const { height: H } = Dimensions.get('window');

interface Props {
  currentLine: EventLine | null;
  lastSpoken: EventLine | null;
}

/**  
 * narration이면 그대로, 그 외엔 직전 대사/나레이션 표시  
 */
export default function TextBox({ currentLine, lastSpoken }: Props) {
  // narration이면 텍스트 있음, dialogue/selection이면 직전 대사 유지
  const shouldShow =
    (currentLine?.type === 'narration' && currentLine.text) ||
    (['dialogue', 'selection'].includes(currentLine?.type ?? '') && lastSpoken?.text);

  if (!shouldShow) return null;

  return (
    <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.box}>
      {currentLine?.type === 'narration'
        ? <EventDialogue character={currentLine.character!} text={currentLine.text ?? ''} />
        : lastSpoken && <EventDialogue character={lastSpoken.character!} text={lastSpoken.text ?? ''} />
      }
    </LinearGradient>
  );
}



const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: H / 2.5,
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 12,
    paddingLeft: 100,
    paddingRight: 100,
  },
});

```

## 📄 `components/event/TitleBanner.tsx`

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

const { height: H } = Dimensions.get('window');

interface Props {
  title: string;
  visible: boolean;
}

const TitleBanner: React.FC<Props> = ({ title, visible }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 등장할 때: 높이 + 투명도 애니메이션
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(height, {
          toValue: H / 4,
          duration: 500,
          useNativeDriver: false, // height는 layout 관련이니까 false
        }),
      ]).start();
    } else {
      // 사라질 때: 투명도만 애니메이션
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.box, { height }]}>
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default TitleBanner;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  box: {
    width: '100%',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    overflow: 'hidden',
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#556390',
    textAlign: 'center',
  },
});

```

## 📄 `components/ui/IconSymbol.ios.tsx`

```tsx
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}

```

## 📄 `components/ui/IconSymbol.tsx`

```tsx
// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

```

## 📄 `components/ui/TabBarBackground.ios.tsx`

```tsx
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}

```

## 📄 `components/ui/TabBarBackground.tsx`

```tsx
// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

export function useBottomTabOverflow() {
  return 0;
}

```

## 📄 `app/+not-found.tsx`

```tsx
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: 'blue',
  },
});

```

## 📄 `app/event-screen.tsx`

```tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import EventPlayer from '../components/event/EventPlayer';   // ← 경로는 프로젝트 구조에 맞게 조정

export default function EventScreen() {
  const { script } = useLocalSearchParams();

  // 쿼리 파라미터가 없거나 타입이 맞지 않는 경우 안전 가드
  if (typeof script !== 'string') return null;

  /*  ✅  decodeURIComponent 필요 없음
      CharacterChat에서 encodeURIComponent를 이미 제거했으므로
      expo‑router가 한 번만 자동 인코딩/디코딩해 줍니다. */
      return (
        <>
          <Stack.Screen options={{ headerShown: false }} />  {/* ✨ 이거 추가 */}
          <EventPlayer script={script} />
        </>
      );
}

```

## 📄 `app/_layout.tsx`

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

```

## 📄 `app/(tabs)/index.tsx`

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MomoContainer from '../../components/MomoContainer';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';

const Home = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' } });
  }, [navigation]);
  return (
    <View style={styles.container}>
      <MomoContainer />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 40,
  },
});

```

## 📄 `app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
    </Tabs>
  );
}

```

