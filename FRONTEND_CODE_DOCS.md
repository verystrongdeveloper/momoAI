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

## 📄 `components/GroupChat.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, Image, TextInput, Button, StyleSheet } from 'react-native';
import { parseGroupChat, ParsedChat } from './hooks/parseGroupChat';
interface Props { groupId: string; }
interface ChatLine {
  sender: string;
  text: string;
  avatar?: any;
  typing?: boolean;
  delay?: number;
}

/* 멤버 DUMMY */
const ROOM_MEMBERS: Record<string, { name: string; avatar: any }[]> = {
  council: [
    { name: '호시노', avatar: require('../assets/images/hoshino.jpg') },
    { name: '세리카', avatar: require('../assets/images/serika.jpg') },
    { name: '시로코', avatar: require('../assets/images/shiroko.jpg') },
    { name: '노노미', avatar: require('../assets/images/nonomi.jpg') },
    { name: '아야네', avatar: require('../assets/images/ayane.jpg') },
  ],
  millennium: [
    { name: '아리스', avatar: require('../assets/images/aris.jpg') },
    { name: '유우카', avatar: require('../assets/images/yuuka.jpg') },
  ],
};

export default function GroupChat({ groupId }: Props) {
  const members = ROOM_MEMBERS[groupId];
  const [msgs, setMsgs] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatLine>>(null);

  /* 스크롤 유지 */
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 30);
    return () => clearTimeout(t);
  }, [msgs]);

  /* 입장 트리거 */
  useEffect(() => {
    const tryTrigger = async () => {
      const shouldTrigger = Math.random() < 0.5;
      if (!shouldTrigger) return;

      try {
        const res = await fetch('http://localhost:3000/api/group/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: groupId }),
        });
        const data = await res.json();

        if (data.answer) {
          await simulateGroupChat(data.answer); // ✅ 수정: 파싱 및 지연 반영
        }
      } catch (e) {
        console.warn(e);
      }
    };

    tryTrigger();
  }, [groupId]);


  const simulateGroupChat = async (raw: string) => {
    const parsed = parseGroupChat(raw);
    let prevSender: string | null = null;
  
    for (const chat of parsed) {
      const m = members.find(v => v.name === chat.sender);
      const avatar = m?.avatar ?? null;
      const showAvatar = prevSender !== chat.sender;
      prevSender = chat.sender;
  
      // (1) 타이핑 "···"
      await new Promise(resolve => {
        setMsgs(prev => [
          ...prev,
          {
            sender: chat.sender,
            text: '···',
            typing: true,
            avatar,
            showAvatar,
          },
        ]);
        resolve(null); // 다음 await을 정확히 순서대로
      });
  
      // (2) 출력 전 delay
      await new Promise(r => setTimeout(r, chat.delay * 1000));
  
      // (3) 실제 대사로 교체
      await new Promise(resolve => {
        setMsgs(prev => [
          ...prev.slice(0, -1),
          {
            sender: chat.sender,
            text: chat.text,
            typing: false,
            avatar,
            showAvatar,
          },
        ]);
        resolve(null);
      });
  
      // (4) 다음 대사 전 딜레이
      if (chat.afterDelay > 0) {
        await new Promise(r => setTimeout(r, chat.afterDelay * 1000));
      }
    }
  };
  



  const simulateTyping = async (
    name: string,
    text: string,
    avatar: any,
    delay = 0,
  ) => {
    /* 1) ‘…’ 타이핑 버블 삽입 -------------------- */
    setMsgs(p => [...p, { sender: name, text: '···', typing: true, avatar }]);

    /* 2) 지연 시간만큼 대기 ----------------------- */
    await new Promise(r => setTimeout(r, (delay || 1) * 1_000));

    /* 3) 타이핑 버블 ↦ 실제 대사로 교체 ---------- */
    setMsgs(p => [...p.slice(0, -1), { sender: name, text, avatar }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const msgCopy = input;
    setInput('');

    // 유저 발화도 ChatLine 형태로 삽입
    setMsgs(p => [...p, {
      sender: 'user',
      text: msgCopy,
      avatar: null,
      typing: false,
      delay: 0,
    }]);

    try {
      const res = await fetch('http://localhost:3000/api/group/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: groupId, userMessage: msgCopy, history: [] }),
      });
      const data = await res.json();

      if (data.answer) {
        await simulateGroupChat(data.answer);
      }
    } catch (e) {
      console.error(e);
    }
  };



  const renderItem = ({
    item,
    index,
  }: {
    item: ChatLine;
    index: number;
  }) => {
    const me = item.sender === 'user';
    const prevSame = index > 0 && msgs[index - 1]?.sender === item.sender && !item.typing;
    if (me) {
      return (
        <View style={[styles.row, styles.rowRight]}>
          <Text style={[styles.bubble, styles.userBubble]}>
            {item.typing ? '···' : item.text}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.row}>
        {/* 아바타 */}
        {!prevSame && <Image source={item.avatar} style={styles.avatar} />}

        {/* 이름 + 채팅 */}
        <View style={styles.chatBlock}>
          {!prevSame && <Text style={styles.name}>{item.sender}</Text>}
          <Text style={[styles.bubble, styles.charBubble]}>
            {item.typing ? '···' : item.text}
          </Text>
        </View>
      </View>
    );
  };


  return (
    /* ───────── 쇼츠용 폰 프레임 ───────── */
    <View style={styles.container}>
      <View style={styles.phoneFrame}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.phoneContent.list}
        />
        <View style={styles.phoneContent.inputBar}>
          <TextInput
            style={styles.phoneContent.input}
            placeholder="메시지를 입력하세요"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <Button title="보내기" onPress={handleSend} />
        </View>
      </View>
    </View>
  );
}

/* ──────────────────────────────────────────── */
const FRAME_WIDTH = 360;
const FRAME_HEIGHT = 640;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* ★ 폰 프레임 */
  phoneFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  /* 내부 요소 그룹화 */
  phoneContent: {
    list: { padding: 12, flexGrow: 1 },
    inputBar: {
      flexDirection: 'row',
      padding: 8,
      borderTopWidth: 1,
      borderColor: '#ddd',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#aaa',
      borderRadius: 6,
      paddingHorizontal: 8,
      marginRight: 6,
    },
  } as any, // 타입스크립트 배려

  /* 채팅 버블/행 */
  row: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  rowRight: { flexDirection: 'row-reverse' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
  },

  chatBlock: {
    flexShrink: 1,
  },

  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },

  bubble: { padding: 8, borderRadius: 10, maxWidth: '75%' },
  userBubble: { backgroundColor: '#DCF8C6' },
  charBubble: { backgroundColor: '#44546A', color: 'white' },
});

```

## 📄 `components/GroupChatList.tsx`

```tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { GROUP_CHAT_ROOMS, GroupChatRoom } from '../constants/groupChatRooms';

interface Props {
  /** 방 진입 시 호출 – 상위(MomoContainer 등)에서 구현 */
  onEnterRoom: (groupId: string) => void;
}

const GroupChatList: React.FC<Props> = ({ onEnterRoom }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 단톡방 리스트</Text>

      {GROUP_CHAT_ROOMS.map((room: GroupChatRoom) => (
        <TouchableOpacity
          key={room.id}
          onPress={() => onEnterRoom(room.id)}
          style={styles.entry}
        >
          <Image source={room.image} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {room.name} ({room.members.length}명)
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {room.lastMessage}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default GroupChatList;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  entry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
import GroupChatList from './GroupChatList';
import GroupChat from './GroupChat';

interface Character {
  name: string;
  status: string;
  image: any;
}

import characters from '../constants/characters'; // 실제 경로 확인


const MomoContainer: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  /** ▲ chat : 1:1 채팅  |  groupList : 단톡방 목록  |  groupChat : 단톡방 실제 채팅 */
  const [activePanel, setActivePanel] = useState<'chat' | 'groupList' | 'groupChat'>('chat');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <MomoHeader />

      <View style={styles.body}>
        {/* ───────── 왼쪽 사이드바 ───────── */}
        <MomoSidebar
          onOpenCharacterList={() => setActivePanel('chat')}
          onOpenGroupChatList={() => {
            setSelectedCharacter(null);
            setActivePanel('groupList');
          }}
        />

        {/* ───────── 왼쪽 리스트 영역 ───────── */}
        <View style={styles.chatList}>
          {activePanel === 'chat' &&
            characters.map((char) => (
              <ChatEntry
                key={char.name}
                image={char.image}
                name={char.name}
                status={char.status}
                onSelect={() => {
                  setSelectedCharacter(char);
                  setActiveGroupId(null);
                  setActivePanel('chat');
                }}
              />
            ))}

          {activePanel === 'groupList' && (
            <GroupChatList
              onEnterRoom={(groupId) => {
                setActiveGroupId(groupId);
                setSelectedCharacter(null);
                setActivePanel('groupChat');   // ★ 단톡방으로 전환
              }}
            />
          )}
        </View>

        {/* ───────── 오른쪽 채팅 / 단톡방 영역 ───────── */}
        <View
          style={[
            styles.chatWindow,
            activePanel === 'groupChat' && styles.narrowWindow, // ✅ 조건부 적용
          ]}
        >
          {activePanel === 'groupChat' && activeGroupId && (
            <GroupChat groupId={activeGroupId} />
          )}

          {activePanel !== 'groupChat' && (
            <MomoChatList
              selectedCharacter={selectedCharacter}
              setGlobalLoading={setGlobalLoading}
            />
          )}
        </View>

      </View>

      {/* 전역 로딩 오버레이 */}
      {globalLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default MomoContainer;

/* -------------------------------------------------------------------- */
/*                              스타일시트                               */
/* -------------------------------------------------------------------- */
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
  chatWindow: {
    flex: 1,
    backgroundColor: 'white',
  },
  narrowWindow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

interface MomoSidebarProps {
  onOpenCharacterList: () => void;
  onOpenGroupChatList: () => void;
}

const MomoSidebar: React.FC<MomoSidebarProps> = ({
  onOpenCharacterList,
  onOpenGroupChatList,
}) => {
  const router = useRouter();

  const testScript = `
타이틀 : 정의와 압수품 사이
narration : (트리니티 학원 복도. 점심시간이 끝난 후인지 학생들이 삼삼오오 교실로 향하고 있다. 저 멀리서 코하루가 보충수업부 친구들과 무언가에 대해 열띠게 토론하며 걸어오고 있다.) [bg : BG_Campus.jpg, music : lovely_picnic.mp3]
코하루(보충수업부) : 그러니까! 그런 건 풍기문란이라니까! 정말이지, 요즘 애들은…! [emotion : koharu_shout.png]
deleteEmotion
narration : (코하루가 열변을 토하며 손을 휘젓다, 들고 있던 분홍색 표지의 책 한 권을 놓치고 만다. 하지만 이야기에 심취한 코하루는 전혀 눈치채지 못한 채 친구들과 함께 사라진다.) [sound : SE_Book_02.mp3]
waitSecond = 2
narration : (그때, 복도를 순찰 중이던 츠루기가 바닥에 떨어진 책을 발견한다.) [bg : BG_Campus.jpg, music : morose_dreamer.mp3]
츠루기(정의실현부) : …응? 이건. [emotion : tsurugi_curious.png]
narration : (책을 집어 든 츠루기는 표지를 보고 코하루의 것임을 직감한다. 마침 멀지 않은 곳에 코하루의 뒷모습이 보인다.)
츠루기(정의실현부) : 코하루…! 네놈, 물건을 떨어뜨렸… [emotion : tsurugi_default.png]
narration : (츠루기가 코하루를 부르려던 순간, 즐겁게 웃으며 친구들과 이야기하는 코하루의 모습이 눈에 들어온다. 츠루기는 잠시 멈칫한다.)
츠루기(정의실현부) : (…지금은… 방해하지 않는 편이 좋겠군. 나중에 전해주자.) [emotion : tsurugi_serious.png]
narration : (츠루기는 책을 자신의 옆구리에 끼고 순찰을 계속한다.)
deleteAll
waitSecond = 2
narration : (몇 시간 후, 정의실현부 부실. 츠루기는 산더미 같은 서류 옆에 코하루의 책을 잠시 내려놓았다.) [bg : BG_CommitteeRoom.jpg, music : morose_dreamer.mp3]
츠루기(정의실현부) : 하아… 이놈의 서류는 끝이 없군. [emotion : tsurugi_serious.png]
narration : (그때, 열린 창문으로 바람이 휙 불어와 책상 위의 서류 몇 장과 함께 코하루의 책 페이지를 빠르게 넘겼다.) [sound : SE_BushRusting_02b.mp3]
츠루기(정의실현부) : 응? [emotion : tsurugi_curious.png]
narration : (츠루기의 시선이 우연히 펼쳐진 책의 한 페이지에 머문다. 그곳에는 상당히… 자극적인 삽화와 문구들이 가득했다.)
츠루기(정의실현부) : 이, 이, 이건… 뭐냐… 이… 파렴치한 것은…!! [emotion : tsurugi_shock.png, expression : question_mark.png, animation : shakeX]
narration : (츠루기의 눈이 점점 커지고, 얼굴이 터질 듯이 새빨개지기 시작한다. 손에 든 책이 부들부들 떨린다.)
츠루기(정의실현부) : 키에에에에에에에에에에에에에에에에에에에에에엑!! [emotion : tsurugi_embarrassed2.png, sound : SE_Cartoon_02.mp3, animation : shakeY]
narration : (츠루기는 극도의 부끄러움과 당황함에 어쩔 줄 몰라하며 부실 안을 허둥지둥 뛰어다녔다. 그 과정에서 손에 쥐고 있던 코하루의 책은 츠루기의 격렬한 몸짓에 이리저리 구겨지고, 바닥에 떨어져 몇 번이나 밟히면서 속절없이 찢어지고 말았다.) [sound : SE_BoomEffect_02.mp3]
waitSecond = 3
deleteAll
narration : (다음 날 아침, 츠루기는 밤새 테이프로 간신히 형태만 복구한 너덜너덜한 책을 들고 코하루를 찾아 나섰다. 그녀의 얼굴에는 수심이 가득했다.) [bg : BG_Campus.jpg, music : morose_dreamer.mp3]
츠루기(정의실현부) : (…이걸 어쩐다… 코하루, 엄청나게 화내겠지…?) [emotion : tsurugi_awkward.png, expression : sweat.png]
narration : (복도 저편에서 코하루가 걸어오는 것이 보인다.)
코하루(보충수업부) : 어라? 츠루기 선배? 웬일이세요, 아침부터. [emotion : koharu_default.png]
츠루기(정의실현부) : 코, 코하루…! 저, 저기… 그게…! [emotion : tsurugi_embarrassed.png]
narration : (츠루기는 덜덜 떨리는 손으로 너덜너덜해진 책을 내밀었다.)
츠루기(정의실현부) : 이, 이거… 네놈 것이지 않나…? 그게… 어제, 내가… 그… 실수로…! 일부러 그런 게 절대 아니다! 정말이다! 미, 미안하다아아! [emotion : tsurugi_embarrassed2.png, sound : SE_Denied_01.mp3]
코하루(보충수업부) : 에엣?! 이, 이건 제… 아니, 제가 압수한 책인데요?! 어쩌다가 이렇게 너덜너덜…?! [emotion : koharu_embarrassed.png, expression : sweat.png]
narration : (코하루는 경악했지만, 정의실현부 부장인 츠루기 앞에서 차마 화를 낼 수는 없었다. 게다가 츠루기의 평소 모습을 알기에 고의가 아니라는 것도 짐작할 수 있었다.)
코하루(보충수업부) : 아, 아뇨! 괜찮아요! 어차피 풍기문란한 압수품이었으니까요! 이렇게 된 것도 뭐… 어쩔 수 없죠! 헤헤. [emotion : koharu_embarrassed2.png]
narration : (코하루는 애써 웃어 보였지만, 너덜너덜해진 책을 받아든 그녀의 눈가에는 미세한 경련과 함께 깊은 아쉬움이 서려 있었다.)
츠루기(정의실현부) : …저, 정말 괜찮나? [emotion : tsurugi_awkward.png]
코하루(보충수업부) : 네, 네에! 그럼요! 전 이제 수업 가봐야 해서…! 나중에 봬요, 선배! [emotion : koharu_closingeyes.png]
narration : (코하루는 황급히 자리를 떴다. 츠루기는 그 뒷모습을 착잡한 심정으로 바라보았다.)
츠루기(정의실현부) : (…역시, 엄청나게 실망한 것 같군…) [emotion : tsurugi_awkward.png]
narration : (한편, 코하루는 복도 모퉁이를 돌자마자 책을 부여잡고 작게 절규했다.)
코하루(보충수업부) : (내 소중한 연구자료가아…! 사형이야, 사형! …아니, 츠루기 선배가 일부러 그런 건 아니지만… 그래도… 으아앙! 다시 구해야 하잖아!) [emotion : koharu_crying.png, bg : BG_ClassCorridor.jpg]
deleteAll
waitSecond = 2
narration : (정의와 압수품 사이에서, 오늘도 트리니티의 하루는 소란스럽게 흘러간다.) [music : none]
endEvent
  `.trim();

  return (
    <View style={styles.sidebar}>
      {/* 캐릭터 리스트 복귀 버튼 */}
      <TouchableOpacity
        onPress={onOpenCharacterList}
        style={styles.iconBtn}
      >
        <Image
          source={require('../assets/images/list.jpg')}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* 메시지 아이콘 → 단톡방 리스트로 진입 */}
      <TouchableOpacity
        onPress={onOpenGroupChatList}
        style={styles.iconBtn}
      >
        <Image
          source={require('../assets/images/message.jpg')}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* 이벤트 테스트 버튼 */}
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/event-screen',
            params: { script: testScript },
          });
        }}
        style={styles.testBtn}
      >
        <Text style={styles.testText}>🎬</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MomoSidebar;

const styles = StyleSheet.create({
  sidebar: {
    width: 60,
    backgroundColor: '#4C5B70',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBtn: {
    marginBottom: 12,
    padding: 6,
    borderRadius: 6,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  testBtn: {
    padding: 6,
    borderRadius: 6,
  },
  testText: {
    fontSize: 25,
    color: 'white',
    fontWeight: 'bold',
  },
});

```

## 📄 `components/event/CharacterSprite.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { emotionMap } from '../constants/eventAssets'; // 경로는 실제 프로젝트에 맞게 조정하세요

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  current: string | null;
  fadeAnim: Animated.Value;
  expression?: {
    image: any;
    visible: boolean;
    fadeAnim: Animated.Value;
  } | null;
  animation?: {
    type: 'shake' | 'slide';
    axis: 'x' | 'y';
    distance: number;
    duration: number;
    iterations?: number;
  } | null;
}

export default function CharacterSprite({
  current,
  fadeAnim,
  expression,
  animation,
}: Props) {
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!animation) {
      translate.setValue({ x: 0, y: 0 });
      return;
    }

    const { type, axis, distance, duration, iterations = 1 } = animation;

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
      for (let i = 0; i < iterations; i++) {
        seq.push(oneCycle(distance), oneCycle(-distance));
      }
      seq.push(backToZero);
    } else if (type === 'slide') {
      seq.push(oneCycle(distance), backToZero);
    }

    Animated.sequence(seq).start();
  }, [animation, translate]);

  /* ───────── style helpers ───────── */
  const charStyle = (key: string) => {
    const baseStyles: any[] = [ // 타입 any로 잠시 변경 (StyleProp<ImageStyle>[])
      styles.char,
      { opacity: key === current ? fadeAnim : 0 },
    ];
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // ★ 츠루기 캐릭터('tsurugi_')인 경우 추가 스타일 적용
    if (key && key.startsWith('tsurugi_')) {
      return [...baseStyles, styles.tsurugiChar];
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    return baseStyles;
  };

  const containerStyle = [
    styles.container,
    {
      transform: [
        { translateX: translate.x },
        { translateY: translate.y },
      ],
    },
  ];

  return (
    <Animated.View style={containerStyle} pointerEvents="none">
      {Object.entries(emotionMap).map(([key, src]) => (
        <Animated.Image
          key={key}
          source={src}
          style={charStyle(key)}
          fadeDuration={0}
        />
      ))}
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -200,
    left: '10%',
    width: W * 0.7,
    aspectRatio: 2000 / 1200,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  char: {
    left: 0,
    width: '110%',
    height: '120%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // ★ 츠루기 전용 스타일 (예시)
  tsurugiChar: {
    // 예: 크기를 약간 다르게 하거나, 위치를 미세 조정할 수 있습니다.
    left: -250,
    bottom: -150,
    width: '140%', // 기본보다 약간 크게
    height: '135%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  expression: {
    position: 'absolute',
    top: H * 0.02,
    left: W * 0.30,
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

