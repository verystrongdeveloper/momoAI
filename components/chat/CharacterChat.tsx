import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Button,
  FlatList,
  Image,
  ImageSourcePropType,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { geminiClient, geminiFailureText } from '@/services/geminiClient';
import { getGeminiKey, subscribeGeminiKey } from '@/services/geminiKey';
import { getGreetMode } from '@/services/greetMode';
import { setPendingEvent } from '@/store/eventStore';
import { saveStory } from '@/store/storyLibrary';
import { useI18n } from '@/i18n';

interface Props {
  characterName: string;
  displayName?: string;
  characterImage: ImageSourcePropType;
  setGlobalLoading?: (value: boolean) => void;
}

interface Chat {
  sender: 'user' | 'character' | 'typing';
  text: string;
  showImage?: boolean;
}

const TYPING_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 한 응답을 문장 단위로 쪼개 실제 채팅처럼 나눠 보낸다. */
const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+(?=\S)/g)
    .map((s) => s.replace(/\n/g, ' ').trim())
    .filter((s) => s !== '' && !/^(\.){2,}$/.test(s));

const CharacterChat: React.FC<Props> = ({ characterName, displayName, characterImage, setGlobalLoading }) => {
  const { t } = useI18n();
  const visibleName = displayName ?? characterName;
  const router = useRouter();

  const apiKey = useSyncExternalStore(subscribeGeminiKey, getGeminiKey, () => '');
  const hasKey = apiKey.trim().length > 0;
  const [messages, setMessages] = useState<Chat[]>([]);
  const [input, setInput] = useState('');
  const [eventReady, setEventReady] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Chat>>(null);
  const waitingRef = useRef(false);

  useEffect(() => {
    // 아이템 렌더 → 레이아웃 계산이 끝난 뒤 스크롤해야 끝까지 내려간다.
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => show.remove();
  }, []);

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

  /* 먼저 말 걸기가 켜져 있으면 입장 시 캐릭터가 먼저 말을 건다 */
  useEffect(() => {
    if (!getGreetMode() || !getGeminiKey().trim()) return;

    let cancelled = false;
    waitingRef.current = true;
    (async () => {
      setMessages((prev) => [...prev, { sender: 'typing', text: '···', showImage: true }]);
      try {
        const { triggerLine } = await geminiClient.trigger(characterName);
        if (!cancelled) waitingRef.current = false;
        await sleep(TYPING_DELAY_MS);
        if (!cancelled) await playReply(triggerLine ?? '');
      } catch (e) {
        console.error('[CharacterChat] trigger 실패:', e);
        if (!cancelled) {
          waitingRef.current = false;
          setMessages((prev) =>
            removeTyping(prev).concat({ sender: 'character', text: geminiFailureText(e), showImage: true }),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterName, hasKey]);

  const handleSend = async () => {
    const text = input.trim();
    if (!hasKey || !text || waitingRef.current) return;

    waitingRef.current = true;
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text },
      { sender: 'typing', text: '···', showImage: true },
    ]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);

    try {
      const { reply, eventReady: ready } = await geminiClient.chat(characterName, text);
      waitingRef.current = false;
      await playReply(reply);
      setEventReady(ready);
    } catch (err) {
      console.error('[CharacterChat] chat 실패:', err);
      waitingRef.current = false;
      setMessages((prev) =>
        removeTyping(prev).concat({ sender: 'character', text: geminiFailureText(err), showImage: true }),
      );
    }
  };

  const handleEventStart = async () => {
    setGlobalLoading?.(true);
    try {
      const { eventScript } = await geminiClient.createEvent(characterName);
      saveStory(characterName, eventScript);
      setPendingEvent(eventScript);
      router.push('/event');
    } catch (e) {
      console.error('[CharacterChat] 이벤트 생성 실패:', e);
      setMessages((prev) => [...prev, { sender: 'character', text: geminiFailureText(e) }]);
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
          {!isUser && item.showImage && <Text style={styles.charName}>{visibleName}</Text>}
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
          <Text style={styles.eventLabel}>| {t('bondEvent')} |</Text>
          <TouchableOpacity style={styles.eventButton} onPress={handleEventStart}>
            <Text style={styles.eventButtonText}>{t('bondStory', { name: visibleName })}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputArea}>
        <TextInput
          ref={inputRef}
          style={[styles.input, !hasKey && styles.inputLocked]}
          placeholder={hasKey ? t('messagePlaceholder') : t('messageKeyRequired')}
          value={hasKey ? input : ''}
          editable={hasKey}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Button title={t('send')} onPress={handleSend} disabled={!hasKey} />
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
  inputLocked: {
    backgroundColor: '#f3f3f3',
    color: '#888',
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
