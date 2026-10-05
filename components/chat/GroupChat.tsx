import React, { useEffect, useRef, useState } from 'react';
import { Button, FlatList, Image, ImageSourcePropType, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '@/services/api';
import { getGreetMode } from '@/services/greetMode';
import { avatarOf } from '@/constants/characters';
import { parseGroupChat } from '@/utils/parseGroupChat';

interface Props {
  groupId: string;
}

interface ChatLine {
  id: number;
  sender: string;
  text: string;
  avatar?: ImageSourcePropType;
  typing?: boolean;
}

/** 재생 중 어느 시점인지. 선생 말을 마지막 대사 뒤에 붙이지 않기 위해 본다. */
interface PlayPhase {
  active: boolean;
  typing: boolean;
  isLast: boolean;
  revealedCount: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const IDLE_PHASE: PlayPhase = { active: false, typing: false, isLast: false, revealedCount: 0 };

export default function GroupChat({ groupId }: Props) {
  const [msgs, setMsgs] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatLine>>(null);

  const aliveRef = useRef(true);
  const playingRef = useRef(false);
  const seqRef = useRef(0);
  const phaseRef = useRef<PlayPhase>(IDLE_PHASE);
  /** 화면에는 이미 올렸고, 아직 반응 요청에 넣지 않은 선생 메시지 */
  const pendingRef = useRef<string[]>([]);
  /** 미리 받아 둔 다음 반응. 마지막 대사가 나오면 바로 꺼낸다. */
  const prefetchRef = useRef<Promise<string | null> | null>(null);

  const nextId = () => {
    seqRef.current += 1;
    return seqRef.current;
  };

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 30);
    return () => clearTimeout(t);
  }, [msgs]);

  const requestReply = (texts: string[]) =>
    api
      .groupChat(groupId, texts.join('\n'))
      .then((res) => res.answer || null)
      .catch((err) => {
        console.error('[GroupChat] chat 실패:', err);
        return null;
      });

  /** 이미 화면에 올린 선생 말로 다음 반응을 미리 받는다. 요청이 겹치지 않게 한 건만 연다. */
  const kickPrefetch = () => {
    if (prefetchRef.current || pendingRef.current.length === 0) return;
    if (!phaseRef.current.active) return;
    const texts = pendingRef.current.splice(0);
    prefetchRef.current = requestReply(texts);
  };

  const takePrefetch = async (): Promise<string | null> => {
    const job = prefetchRef.current;
    if (!job) return null;
    const answer = await job;
    if (prefetchRef.current === job) prefetchRef.current = null;
    return aliveRef.current ? answer : null;
  };

  /** 한 묶음을 끝까지 재생한다. 마지막 대사가 나오는 순간 큐에 있던 다음 반응을 돌려준다. */
  const playOneBatch = async (raw: string): Promise<string | null> => {
    const lines = parseGroupChat(raw);

    for (let i = 0; i < lines.length; i++) {
      if (!aliveRef.current) return null;
      const chat = lines[i];
      const isLast = i === lines.length - 1;
      const avatar = avatarOf(chat.sender);
      const typingId = nextId();

      phaseRef.current = { active: true, typing: true, isLast, revealedCount: i };
      setMsgs((prev) => [...prev, { id: typingId, sender: chat.sender, text: '···', typing: true, avatar }]);
      kickPrefetch();

      await sleep(chat.delay * 1000);
      if (!aliveRef.current) return null;

      setMsgs((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, sender: chat.sender, text: chat.text, avatar } : m)));
      phaseRef.current = { active: true, typing: false, isLast, revealedCount: i + 1 };
      kickPrefetch();

      if (isLast) {
        const queued = await takePrefetch();
        if (queued) return queued;
        if (chat.afterDelay > 0) await sleep(chat.afterDelay * 1000);
        if (!aliveRef.current) return null;
        return takePrefetch();
      }

      if (chat.afterDelay > 0) await sleep(chat.afterDelay * 1000);
    }

    return null;
  };

  const playChain = async (firstRaw: string) => {
    let raw: string | null = firstRaw;
    while (raw && aliveRef.current) {
      raw = await playOneBatch(raw);
    }
  };

  /** 재생이 끝난 뒤 남아 있는 선생 말·미리 받은 반응을 비운다. */
  const releasePlayback = async () => {
    while (aliveRef.current) {
      if (prefetchRef.current) {
        const answer = await takePrefetch();
        if (answer) {
          await playChain(answer);
          continue;
        }
      }
      if (pendingRef.current.length > 0) {
        const texts = pendingRef.current.splice(0);
        const answer = await requestReply(texts);
        if (answer && aliveRef.current) {
          await playChain(answer);
          continue;
        }
      }
      break;
    }
    phaseRef.current = IDLE_PHASE;
    if (aliveRef.current) playingRef.current = false;
  };

  /* 먼저 말 걸기가 켜져 있으면 입장 시 멤버들이 먼저 떠든다 */
  useEffect(() => {
    aliveRef.current = true;
    playingRef.current = false;
    pendingRef.current = [];
    prefetchRef.current = null;
    phaseRef.current = IDLE_PHASE;

    if (!getGreetMode()) {
      return () => {
        aliveRef.current = false;
      };
    }

    playingRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const { answer } = await api.groupTrigger(groupId);
        if (!cancelled && answer) await playChain(answer);
      } catch (e) {
        console.warn('[GroupChat] trigger 실패:', e);
      } finally {
        if (!cancelled) await releasePlayback();
      }
    })();

    return () => {
      cancelled = true;
      aliveRef.current = false;
    };
    // 방 진입 때 한 번만. playChain은 이 렌더의 ref를 쓴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');

    setMsgs((prev) => [...prev, { id: nextId(), sender: 'user', text }]);

    if (playingRef.current) {
      pendingRef.current.push(text);
      kickPrefetch();
      return;
    }

    playingRef.current = true;

    try {
      const { answer } = await api.groupChat(groupId, text);
      if (aliveRef.current && answer) await playChain(answer);
    } catch (e) {
      console.error('[GroupChat] chat 실패:', e);
    } finally {
      if (aliveRef.current) await releasePlayback();
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

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.inputArea}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listContent: {
    padding: 10,
    flexGrow: 1,
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
  row: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-start' },
  rowRight: { flexDirection: 'row-reverse' },
  avatarSlot: { width: 50, marginRight: 6 },
  avatar: { width: 50, height: 50, borderRadius: 18 },
  chatBlock: { flexShrink: 1, maxWidth: '85%' },
  name: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 15,
  },
  bubble: { padding: 10, borderRadius: 12, fontSize: 16, lineHeight: 22 },
  userBubble: { backgroundColor: '#DCF8C6' },
  charBubble: { backgroundColor: '#44546A', color: 'white' },
});
