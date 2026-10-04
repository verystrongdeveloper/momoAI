import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, FlatList, Image, ImageSourcePropType, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '@/services/api';
import { avatarOf } from '@/constants/characters';
import { useLayout } from '@/hooks/useLayout';
import { parseGroupChat } from '@/utils/parseGroupChat';

interface Props {
  groupId: string;
}

interface ChatLine {
  sender: string;
  text: string;
  avatar?: ImageSourcePropType;
  typing?: boolean;
}

/** 쇼츠 촬영용 폰 프레임 크기. 넓은 화면에서만 고정 크기로 가운데 배치한다. */
const FRAME_WIDTH = 360;
const FRAME_HEIGHT = 640;
const TRIGGER_CHANCE = 0.5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function GroupChat({ groupId }: Props) {
  const { isCompact } = useLayout();
  const [msgs, setMsgs] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatLine>>(null);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 30);
    return () => clearTimeout(t);
  }, [msgs]);

  /** 서버 응답(여러 캐릭터 대사)을 지연 시간에 맞춰 순서대로 출력 */
  const simulateGroupChat = async (raw: string) => {
    for (const chat of parseGroupChat(raw)) {
      const avatar = avatarOf(chat.sender);

      setMsgs((prev) => [...prev, { sender: chat.sender, text: '···', typing: true, avatar }]);
      await sleep(chat.delay * 1000);
      setMsgs((prev) => [...prev.slice(0, -1), { sender: chat.sender, text: chat.text, avatar }]);

      if (chat.afterDelay > 0) await sleep(chat.afterDelay * 1000);
    }
  };

  /* 입장 시 일정 확률로 멤버들이 먼저 떠든다 */
  useEffect(() => {
    if (Math.random() >= TRIGGER_CHANCE) return;

    (async () => {
      try {
        const { answer } = await api.groupTrigger(groupId);
        if (answer) await simulateGroupChat(answer);
      } catch (e) {
        console.warn('[GroupChat] trigger 실패:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');
    setMsgs((prev) => [...prev, { sender: 'user', text }]);

    try {
      const { answer } = await api.groupChat(groupId, text);
      if (answer) await simulateGroupChat(answer);
    } catch (e) {
      console.error('[GroupChat] chat 실패:', e);
    }
  };

  const renderItem = ({ item, index }: { item: ChatLine; index: number }) => {
    if (item.sender === 'user') {
      return (
        <View style={[styles.row, styles.rowRight]}>
          <Text style={[styles.bubble, styles.userBubble]}>{item.text}</Text>
        </View>
      );
    }

    // 같은 사람이 연달아 말하면 아바타/이름은 첫 줄에만
    const prevSame = index > 0 && msgs[index - 1]?.sender === item.sender && !item.typing;

    return (
      <View style={styles.row}>
        <View style={styles.avatarSlot}>{!prevSame && item.avatar && <Image source={item.avatar} style={styles.avatar} />}</View>
        <View style={styles.chatBlock}>
          {!prevSame && <Text style={styles.name}>{item.sender}</Text>}
          <Text style={[styles.bubble, styles.charBubble]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const frameStyle = useMemo(
    () => (isCompact ? styles.frameFill : styles.frameFixed),
    [isCompact],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.frame, frameStyle]}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Button title="보내기" onPress={handleSend} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  frameFixed: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  frameFill: {
    flex: 1,
    width: '100%',
  },
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
    paddingVertical: 6,
    marginRight: 6,
  },
  row: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  rowRight: { flexDirection: 'row-reverse' },
  avatarSlot: { width: 48, marginRight: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  chatBlock: { flexShrink: 1 },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
  bubble: { padding: 8, borderRadius: 10 },
  userBubble: { backgroundColor: '#DCF8C6', maxWidth: '80%' },
  charBubble: { backgroundColor: '#44546A', color: 'white' },
});
