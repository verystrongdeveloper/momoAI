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
          console.log('[입장 트리거] 서버에서 받아온 그룹채팅:', data.answer);
          await simulateGroupChat(data.answer); // ✅ 파싱 및 지연 반영
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
    setMsgs(p => [...p, { sender: name, text: '···', typing: true, avatar }]);
    await new Promise(r => setTimeout(r, (delay || 1) * 1_000));
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
        console.log('[sendGroupChat] 서버에서 받아온 그룹채팅:', data.answer);
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
  } as any,
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
