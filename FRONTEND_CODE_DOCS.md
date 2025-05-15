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

interface Props { groupId: string; }
interface ChatLine {
  sender: string;
  text: string;
  avatar?: any;
  typing?: boolean;
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
      const shouldTrigger = Math.random() < 0.5; // 👉 50% 확률
      if (!shouldTrigger) return;
  
      try {
        const res = await fetch('http://localhost:3000/api/group/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: groupId }),
        });
        const data = await res.json();
  
        if (data.answer) {
          const lines = data.answer.split('\n').map((line: string) => {
            const match = line.match(/^\[(.+?)\] ?: ?(.+)$/);
            if (!match) return null;
            const [, speaker, text] = match;
            const m = members.find(v => v.name === speaker);
            return m ? { sender: speaker, text, avatar: m.avatar } : null;
          }).filter(Boolean);
  
          for (const chat of lines) {
            if (chat) await simulateTyping(chat.sender, chat.text, chat.avatar);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };
  
    tryTrigger();
  }, [groupId]);
  

  const simulateTyping = async (name: string, text: string, avatar: any) => {
    setMsgs(p => [...p, { sender: name, text: '', typing: true, avatar }]);
    await new Promise(r => setTimeout(r, 1000));
    setMsgs(p => [...p.slice(0, -1), { sender: name, text, avatar }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setMsgs(p => [...p, { sender: 'user', text: input }]);
    const msgCopy = input;
    setInput('');
    try {
      const res = await fetch('http://localhost:3000/api/group/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: groupId, userMessage: msgCopy, history: [] }),
      });
      const data = await res.json();
      const lines = data.answer.split('\n').map((line: string) => {
        const match = line.match(/^\[(.+?)\] ?: ?(.+)$/); // 예: "[호시노] : 으헤~"
        if (!match) return null;
        const [, speaker, text] = match;
        const m = members.find(v => v.name === speaker);
        return m ? { sender: speaker, text, avatar: m.avatar } : null;
      }).filter(Boolean);

      for (const chat of lines) {
        if (chat) await simulateTyping(chat.sender, chat.text, chat.avatar);
      }
    } catch (e) { console.error(e); }
  };

  const renderItem = ({ item }: { item: ChatLine }) => {
    const me = item.sender === 'user';
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
        <Image source={item.avatar} style={styles.avatar} />

        {/* 이름 + 채팅 */}
        <View style={styles.chatBlock}>
          <Text style={styles.name}>{item.sender}</Text>
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
타이틀 : 선도부의 비밀스러운 오후
narration : (게헨나 학원 선도부 사무실. 한가한 오후, 나는 문서 검토 부탁을 받고 들어섰다.) [bg : BG_GehennaStudentCouncil_Tent.jpg, music : unwelcome_school.mp3]
아코(선도부) : 선생님, 오셨군요. 기다리고 있었습니다. [emotion : ako_serious.png]
아코(선도부) : 오늘 검토해야 할 서류가 있어서 연락드렸습니다. 히나 부장님이 먼저 확인한 후 전달해 달라 하셨거든요. [emotion : ako_smile.png]
selection : (1)"히나는 어디 있어?" (2)"언제나처럼 바쁘네, 아코."
아코(선도부) : 히나 부장님은 잠시 자리를 비우셨습니다. 곧 돌아오실 겁니다. [emotion : ako_serious.png]
아코(선도부) : 아, 차 한 잔 내드릴게요. 오늘은 특별히 유자차를 준비했습니다. [emotion : ako_smile.png, sound : SE_Cup_02.mp3]
narration : (아코는 책상 위에 놓인 주전자에서 따뜻한 유자차를 따라 내밀었다.)
아코(선도부) : 요즘 건강관리 하고 계신가요? 감기 조심하셔야 합니다. [emotion : ako_curious.png]
selection : (1)"아코도 건강 챙기고 있어?" (2)"아코와 히나는 서로 잘 챙겨주나 보네."
아코(선도부) : 저야 뭐... 히나 부장님이 강제로라도 챙기게 하니까요. [emotion : ako_awkward.png]
아코(선도부) : 항상 "아코, 너 또 밤새웠지?" 하면서요... [emotion : ako_weaksmile.png]
narration : (아코의 얼굴이 살짝 붉어졌다.)
아코(선도부) : 그...그런데 부장님도 말이 좋아서 그렇지, 자신은 더 심하게 일하시면서... [emotion : ako_upset.png]
히나(선도부) : 내 얘기를 하고 있나 보네. [emotion : hina_expressionless.png]
narration : (갑작스러운 히나의 등장에 아코가 화들짝 놀랐다.) [animation : shakeX]
아코(선도부) : 히, 히나 부장님?! [emotion : ako_shout.png]
아코(선도부) : 언제 오셨어요? 문 여는 소리도 못 들었는데... [emotion : ako_sweating.png]
히나(선도부) : 방금. 선생도 왔네. [emotion : hina_expressionless.png]
히나(선도부) : 서류 검토하러 온 거지? [emotion : hina_serious.png]
selection : (1)"응, 아코가 연락해서 왔어." (2)"너희 둘 다 오늘따라 긴장된 분위기네."
히나(선도부) : 그래. 아코가 선생을 불러줬구나. [emotion : hina_weaksmile.png]
히나(선도부) : 방금 무슨 얘기했어? [emotion : hina_makebigeyes.png]
아코(선도부) : 아...아무것도 아니에요! 그냥 날씨 얘기를... [emotion : ako_shout_with_angry.png]
히나(선도부) : 그래? 날씨 얘기에 내 이름이 왜 나오지? [emotion : hina_makebigeyes.png]
아코(선도부) : 그건... 저... [emotion : ako_sweating.png]
narration : (아코가 당황한 기색이 역력하다. 히나는 의아한 표정으로 아코를 바라보았다.)
히나(선도부) : 하아... 중요한 건 아니니까 넘어갈게. [emotion : hina_closingeyes.png]
히나(선도부) : 아, 선생. 차 마셨어? 아코가 내려준 거? [emotion : hina_weaksmile.png]
selection : (1)"응, 유자차. 맛있더라." (2)"아코가 특별히 준비했다던데."
히나(선도부) : 그 차... [emotion : hina_embarrassed.png]
히나(선도부) : 사실 내가 좋아하는 건데. 아코가 그걸 어떻게 알았지? [emotion : hina_expressionless.png]
아코(선도부) : 그거야... 부장님이 언젠가 한 번 말씀하셨잖아요. [emotion : ako_awkward.png]
아코(선도부) : 유자차가 피로회복에 좋다고... 요즘 부장님이 많이 피곤해 보이셔서... [emotion : ako_weaksmile.png]
히나(선도부) : 그런 말을 했었나? [emotion : hina_sweating.png]
아코(선도부) : 네! 분명히 하셨어요! [emotion : ako_shout.png]
히나(선도부) : 그래? 기억이 안 나는데... [emotion : hina_expressionless.png]
narration : (뭔가 둘 사이에 미묘한 기류가 흐르는 것이 느껴졌다.)
히나(선도부) : 아무튼, 서류 확인하자. [emotion : hina_serious.png]
narration : (히나가 테이블 위에 서류 묶음을 올려놓았다.)
히나(선도부) : 이번 학기 선도부 활동 계획서야. 확인해 줘. [emotion : hina_expressionless.png]
selection : (1)"둘이 같이 검토하면 더 효율적일 것 같은데." (2)"난 잠시 자리를 비켜줄까?"
히나(선도부) : 둘이? 아코랑? [emotion : hina_makebigeyes.png]
아코(선도부) : 저...저도 같이요? [emotion : ako_sweating.png]
히나(선도부) : 나쁘지 않은 생각이네. [emotion : hina_weaksmile.png]
히나(선도부) : 아코, 넌 계획안 3페이지부터 검토해. 난 1페이지부터 볼게. [emotion : hina_serious.png]
아코(선도부) : 네, 알겠습니다! [emotion : ako_serious.png]
narration : (세 사람은 테이블에 둘러앉아 서류를 검토하기 시작했다. 잠시 침묵이 흐른다.)
아코(선도부) : 음... 이 부분은 좀 모호한 것 같은데요. [emotion : ako_serious.png]
아코(선도부) : "필요시 추가 인력 배치"라는 건 구체적으로 어떤 상황을 말하는 건가요? [emotion : ako_curious.png]
히나(선도부) : 그거? 축제 기간이랑 시험 기간에 순찰 인원 늘리는 거. [emotion : hina_expressionless.png]
아코(선도부) : 아, 그럼 이렇게 수정하는 게 좋겠네요. [emotion : ako_smile.png]
narration : (아코가 펜을 들어 메모를 하려다 실수로 히나의 손에 펜이 닿았다.) [sound : SE_Confirm_01.mp3]
아코(선도부) : 앗! 죄송합니다! [emotion : ako_awkward.png, animation : shakeY]
히나(선도부) : ... [emotion : hina_embarrassed.png]
히나(선도부) : 괜찮아. [emotion : hina_littlebitembarrassed.png]
narration : (순간 사무실 안이 어색한 침묵에 휩싸였다.)
selection : (1)"음, 차 좀 더 마실까?" (2)"두 사람, 요즘 괜찮아?"
히나(선도부) : 차... 그래, 차 좀 더 마시자. [emotion : hina_expressionless.png]
히나(선도부) : 아코, 차 좀 더 따라줄래? [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네! 당장 따라드릴게요. [emotion : ako_smile.png, sound : SE_Cup_02.mp3]
narration : (아코가 서둘러 차를 따르는 동안, 히나는 창문 밖을 바라보고 있다.)
아코(선도부) : 여기 있습니다. [emotion : ako_smile_with_closing_eyes.png]
히나(선도부) : 고마워. [emotion : hina_weaksmile.png]
아코(선도부) : 아, 저기... 부장님. [emotion : ako_serious.png]
히나(선도부) : 왜? [emotion : hina_expressionless.png]
아코(선도부) : 오늘 밤 순찰 일정 말인데요. 부장님이 많이 피곤해 보이셔서... 제가 대신 할까요? [emotion : ako_weaksmile.png]
히나(선도부) : ... [emotion : hina_closingeyes.png]
히나(선도부) : 괜찮아. 내가 할 수 있어. [emotion : hina_expressionless.png]
아코(선도부) : 하지만 부장님, 요즘 너무 무리하시는 것 같아요. [emotion : ako_serious.png]
selection : (1)"히나, 아코 말이 맞는 것 같아." (2)"서로 도와가며 일하는 게 좋을 것 같아."
히나(선도부) : ... [emotion : hina_closingeyes.png]
히나(선도부) : 선생까지 그런 말을 하네. [emotion : hina_weaksmile.png]
히나(선도부) : 그래, 알았어. 오늘은 아코랑 같이 순찰하자. [emotion : hina_expressionless.png]
아코(선도부) : 정말요?! [emotion : ako_bigsmile.png]
아코(선도부) : 아, 아니... 그러니까... 좋은 결정이십니다, 부장님. [emotion : ako_awkward.png]
히나(선도부) : 왜 그렇게 좋아하는 거야? 일인데. [emotion : hina_sweating.png]
아코(선도부) : 그건... 부장님이랑 함께 일하면 배울 게 많아서요. [emotion : ako_smile.png]
히나(선도부) : 그래? [emotion : hina_littlebitembarrassed.png]
narration : (히나가 작게 미소를 지었다. 평소와는 다른 표정이었다.)
selection : (1)"히나가 웃는 모습은 정말 보기 드물지." (2)"두 사람이 함께 있으면 분위기가 달라지네."
히나(선도부) : 뭐, 뭘 보고 있어? [emotion : hina_embarrassed.png]
아코(선도부) : 부장님, 얼굴이 빨개졌어요! [emotion : ako_bigsmile.png]
히나(선도부) : 안 그래. 그냥 더워서 그래. [emotion : hina_embarrassed3.png]
아코(선도부) : 하지만 여긴 에어컨이 잘 작동하고 있는데요? [emotion : ako_smile.png]
히나(선도부) : ... [emotion : hina_embarrassed2.png]
narration : (히나는 자리에서 벌떡 일어났다.)
히나(선도부) : 잠깐 바람 좀 쐬고 올게. [emotion : hina_embarrassed.png]
아코(선도부) : 부장님? 괜찮으세요? [emotion : ako_curious.png]
히나(선도부) : 괜찮아. 그냥... 잠시만. [emotion : hina_closingeyes.png, sound : SE_DoorClose_01.mp3]
narration : (히나가 급하게 사무실을 나갔다.)
selection : (1)"무슨 일이 있었던 거야?" (2)"아코, 히나한테 무슨 일이 생긴 거 아니야?"
아코(선도부) : 저도... 잘 모르겠어요. [emotion : ako_sweating.png]
아코(선도부) : 최근에 부장님이 조금... 이상하시긴 했어요. [emotion : ako_upset.png]
아코(선도부) : 제가 옆에 있으면 자꾸 당황하시고... [emotion : ako_weaksmile.png]
narration : (아코가 말끝을 흐렸다.)
아코(선도부) : 선생님... 비밀 하나 말해도 될까요? [emotion : ako_serious.png]
selection : (1)"물론이지. 무슨 일이야?" (2)"히나에 관한 일이야?"
아코(선도부) : 사실... 어제... [emotion : ako_awkward.png]
아코(선도부) : 제가 부장님께 편지를 드렸어요. [emotion : ako_upset.png]
아코(선도부) : 그... 감사하다는 내용이었는데... 조금 더 깊은 감정도 있었어요. [emotion : ako_sweating.png]
아코(선도부) : 아마도 그래서 부장님이 저를 보면 어색해하시는 것 같아요. [emotion : ako_upset.png]
selection : (1)"히나에게 고백한 거야?" (2)"아코, 너 히나를 좋아하는구나."
아코(선도부) : 고백이라기보다는... [emotion : ako_crying.png]
아코(선도부) : 네... 저는 부장님을 존경하는 것 이상으로... [emotion : ako_weaksmile.png]
아코(선도부) : 하지만 부장님의 반응을 보니... 아마 거절당한 것 같아요. [emotion : ako_upset.png]
narration : (아코의 표정이 어두워졌다.)
아코(선도부) : 이제 어쩌죠, 선생님? 부장님과 계속 일해야 하는데... [emotion : ako_crying.png]
selection : (1)"히나와 직접 대화해 보는 게 어때?" (2)"아직 히나가 분명하게 답한 건 아니잖아."
아코(선도부) : 대화요...? [emotion : ako_curious.png]
아코(선도부) : 하지만 부장님은 제 앞에서 도망가셨는걸요. [emotion : ako_upset.png]
narration : (갑자기 사무실 문이 열렸다.) 
히나(선도부) : 아코. [emotion : hina_serious.png]
아코(선도부) : 부, 부장님?! [emotion : ako_shout.png, animation : shakeX]
히나(선도부) : 할 얘기가 있어. [emotion : hina_expressionless.png]
히나(선도부) : 선생, 잠시 우리만 있게 해줄래? [emotion : hina_serious.png]
selection : (1)"그래, 이해해." (2)"응, 두 사람이서 잘 얘기해봐."
히나(선도부) : 고마워. [emotion : hina_weaksmile.png]
narration : (나는 조용히 자리에서 일어나 사무실 밖으로 나왔다.)
deleteAll
waitSecond = 2
narration : (복도에서 잠시 기다리는 동안, 선도부 사무실 안에서 무슨 일이 벌어지고 있을지 궁금했다.) [bg : BG_GehennaCorridor_Party.jpg]
narration : (약 10분 정도가 지나자 사무실 문이 열렸다.)
히나(선도부) : 선생, 들어와도 돼. [emotion : hina_expressionless.png]
selection : (1)"어떻게 됐어?" (2)"괜찮아 보이네."
히나(선도부) : ... [emotion : hina_littlebitembarrassed.png]
narration : (사무실로 들어서자 아코가 환하게 웃고 있었다.)
아코(선도부) : 선생님! [emotion : ako_bigsmile.png]
히나(선도부) : 일단 서류 검토부터 마무리하자. [emotion : hina_serious.png]
아코(선도부) : 네, 부장님! [emotion : ako_eyesmile.png]
narration : (두 사람 사이의 분위기가 확연히 달라져 있었다.)
selection : (1)"무슨 좋은 일이라도?" (2)"서류 검토 계속할까?"
히나(선도부) : 서류 검토 계속하자. [emotion : hina_embarrassed.png]
아코(선도부) : 네! 바로 시작하겠습니다! [emotion : ako_smile_with_closing_eyes.png]
narration : (히나와 아코는 서로 눈빛을 교환하며 미소를 지었다.)
히나(선도부) : 아코. [emotion : hina_weaksmile.png]
아코(선도부) : 네, 부장님? [emotion : ako_smile.png]
히나(선도부) : 차 좀 더 따라줄래? [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네! 당장이요! [emotion : ako_bigsmile.png, sound : SE_Cup_02.mp3]
narration : (아코가 차를 따르는 동안, 히나는 내게 작은 목소리로 말했다.)
히나(선도부) : 선생... 고마워. [emotion : hina_weaksmile2.png]
selection : (1)"무슨 일이 있었던 거야?" (2)"서로의 마음을 확인한 모양이네."
히나(선도부) : ... [emotion : hina_embarrassed.png]
히나(선도부) : 그냥... 서로 오해가 있었어. [emotion : hina_littlebitembarrassed.png]
히나(선도부) : 나도 아코에게 할 말이 있었거든. [emotion : hina_weaksmile.png]
narration : (히나의 표정에서 행복감이 묻어났다.)
아코(선도부) : 여기 차 있습니다! [emotion : ako_bigsmile.png]
히나(선도부) : 고마워, 아코. [emotion : hina_weaksmile.png]
아코(선도부) : 부장님... [emotion : ako_smile.png]
히나(선도부) : 응? [emotion : hina_weaksmile.png]
아코(선도부) : 아니에요. 그냥... 고맙습니다. [emotion : ako_smile_with_closing_eyes.png]
narration : (두 사람의 시선이 다시 한번 마주쳤다.)
selection : (1)"이제 서류 검토를 마무리할까?" (2)"나는 이만 가볼게."
히나(선도부) : 응, 서류 검토 마무리하자. [emotion : hina_serious.png]
히나(선도부) : 선생도 도와줘. [emotion : hina_expressionless.png]
아코(선도부) : 저도 열심히 하겠습니다! [emotion : ako_smile.png]
narration : (세 사람은 다시 서류 검토에 집중했다. 하지만 이제 사무실의 분위기는 완전히 달라져 있었다.)
narration : (시간이 흘러 검토가 끝나갈 무렵, 창밖으로는 저녁 노을이 지고 있었다.)
히나(선도부) : 다 끝났네. 고생했어. [emotion : hina_weaksmile.png]
아코(선도부) : 부장님도 수고하셨습니다. [emotion : ako_smile.png]
selection : (1)"두 사람도 이제 쉬는 게 좋겠어." (2)"저녁 식사는 어떻게 할 거야?"
히나(선도부) : 그러고 보니 저녁 시간이네. [emotion : hina_expressionless.png]
아코(선도부) : 맞아요. 벌써 이런 시간이... [emotion : ako_curious.png]
히나(선도부) : 아코. [emotion : hina_expressionless.png]
아코(선도부) : 네, 부장님? [emotion : ako_curious.png]
히나(선도부) : 저녁... 같이 먹을래? [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네?! [emotion : ako_shout.png]
아코(선도부) : 아, 네! 물론이죠! [emotion : ako_bigsmile.png]
히나(선도부) : 선생도 같이 갈래? [emotion : hina_weaksmile.png]
selection : (1)"아니, 나는 다른 약속이 있어." (2)"두 사람이서 가는 게 좋을 것 같아."
히나(선도부) : 그래? [emotion : hina_embarrassed.png]
히나(선도부) : 그럼... 아코, 우리 둘이서 가자. [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네, 부장님! [emotion : ako_bigsmile.png]
narration : (두 사람은 서류를 정리하고 함께 사무실을 나설 준비를 했다.)
히나(선도부) : 선생, 오늘 도와줘서 고마워. [emotion : hina_weaksmile.png]
아코(선도부) : 네, 정말 감사합니다, 선생님! [emotion : ako_smile_with_closing_eyes.png]
selection : (1)"별 거 아니야. 잘 다녀와." (2)"두 사람이 행복해 보여서 다행이야."
히나(선도부) : ... [emotion : hina_embarrassed.png]
아코(선도부) : 선생님... [emotion : ako_weaksmile.png]
히나(선도부) : 가자, 아코. [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네, 부장님! [emotion : ako_bigsmile.png, sound : SE_DoorClose_01.mp3]
narration : (두 사람은 함께 사무실을 나섰다. 창밖으로 보이는 저녁 노을이 두 사람의 모습을 붉게 물들였다.)
deleteAll
waitSecond = 2
narration : (나는 조용히 선도부 사무실을 나왔다. 복도 끝에서 히나와 아코가 나란히 걸어가는 모습이 보였다.) [bg : BG_GehennaStreet.jpg, music : future_bossa.mp3]
narration : (가끔은 엄격한 선도부장과 그의 충실한 행정관 사이에도 다른 감정이 피어날 수 있다는 것을 오늘 알게 된 것 같다.)
narration : (두 사람의 손이 우연히 스쳤고, 히나가 슬쩍 아코의 손을 잡는 모습을 보았다. 아코의 얼굴이 붉게 물들었다.)
narration : (게헨나 학원의 엄격한 규율 속에서도, 때로는 이런 따뜻한 순간이 있다는 것이 참 다행이라는 생각이 들었다.)
deleteAll
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

