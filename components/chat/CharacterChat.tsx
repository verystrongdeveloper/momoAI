import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { setPendingEvent } from '@/store/eventStore';

interface Props {
  characterName: string;
  characterImage: ImageSourcePropType;
  setGlobalLoading?: (value: boolean) => void;
}

interface Chat {
  sender: 'user' | 'character' | 'typing';
  text: string;
  showImage?: boolean;
}

const TYPING_DELAY_MS = 1500;
const TRIGGER_CHANCE = 0.5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 한 응답을 문장 단위로 쪼개 실제 채팅처럼 나눠 보낸다. */
const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+(?=\S)/g)
    .map((s) => s.replace(/\n/g, ' ').trim())
    .filter((s) => s !== '' && !/^(\.){2,}$/.test(s));

const CharacterChat: React.FC<Props> = ({ characterName, characterImage, setGlobalLoading }) => {
  const router = useRouter();

  const [messages, setMessages] = useState<Chat[]>([]);
  const [input, setInput] = useState('');
  const [eventReady, setEventReady] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Chat>>(null);

  useEffect(() => {
    // 아이템 렌더 → 레이아웃 계산이 끝난 뒤 스크롤해야 끝까지 내려간다.
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages]);

  const removeTyping = (prev: Chat[]) => prev.filter((m) => m.sender !== 'typing');

  /** 캐릭터 응답을 타이핑 표시와 함께 문장별로 출력 */
  const playReply = async (text: string) => {
    const sentences = splitSentences(text);
    if (sentences.length === 0) {
      setMessages(removeTyping);
      return;
    }

    setMessages((prev) => removeTyping(prev).concat({ sender: 'character', text: sentences[0], showImage: true }));

    for (let i = 1; i < sentences.length; i++) {
      setMessages((prev) => [...prev, { sender: 'typing', text: '···' }]);
      await sleep(TYPING_DELAY_MS);
      setMessages((prev) => removeTyping(prev).concat({ sender: 'character', text: sentences[i] }));
    }
  };

  /* 입장 시 일정 확률로 캐릭터가 먼저 말을 건다 */
  useEffect(() => {
    if (Math.random() >= TRIGGER_CHANCE) return;

    let cancelled = false;
    (async () => {
      setMessages((prev) => [...prev, { sender: 'typing', text: '···', showImage: true }]);
      try {
        const { triggerLine } = await api.trigger(characterName);
        await sleep(TYPING_DELAY_MS);
        if (!cancelled) await playReply(triggerLine ?? '');
      } catch (e) {
        console.error('[CharacterChat] trigger 실패:', e);
        if (!cancelled) setMessages(removeTyping);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterName]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);

    try {
      const { reply, eventReady: ready } = await api.chat(characterName, text);
      await playReply(reply);
      setEventReady(ready);
    } catch (err) {
      console.error('[CharacterChat] chat 실패:', err);
      setMessages((prev) => [...prev, { sender: 'character', text: '에러가 발생했어요.' }]);
    }
  };

  const handleEventStart = async () => {
    setGlobalLoading?.(true);
    try {
      const { eventScript } = await api.createEvent(characterName);
      setPendingEvent(eventScript);
      router.push('/event');
    } catch (e) {
      console.error('[CharacterChat] 이벤트 생성 실패:', e);
    } finally {
      setGlobalLoading?.(false);
    }
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const isUser = item.sender === 'user';
    const isTyping = item.sender === 'typing';

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowRight]}>
        {!isUser && (
          <View style={styles.avatarWrapper}>
            {item.showImage && <Image source={characterImage} style={styles.avatar} />}
          </View>
        )}
        <View style={styles.messageColumn}>
          {!isUser && item.showImage && <Text style={styles.charName}>{characterName}</Text>}
          <Text style={[styles.bubble, isUser ? styles.userBubble : styles.charBubble, isTyping && styles.typingBubble]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {eventReady && (
        <View style={styles.eventContainer}>
          <Text style={styles.eventLabel}>| 인연 이벤트 |</Text>
          <TouchableOpacity style={styles.eventButton} onPress={handleEventStart}>
            <Text style={styles.eventButtonText}>{characterName}의 인연 스토리로.</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputArea}>
        <TextInput
          ref={inputRef}
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
  );
};

export default CharacterChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listContent: {
    padding: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  messageRowRight: {
    flexDirection: 'row-reverse',
  },
  messageColumn: {
    flexShrink: 1,
    maxWidth: '85%',
  },
  avatarWrapper: {
    width: 50,
    marginRight: 6,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
  },
  charName: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 15,
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
  },
  charBubble: {
    backgroundColor: '#44546A',
    color: 'white',
  },
  typingBubble: {
    letterSpacing: 2,
    fontSize: 16,
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
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  eventContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  eventLabel: {
    color: '#888',
    fontSize: 13,
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
    fontSize: 15,
  },
});
