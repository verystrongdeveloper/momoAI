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
                try {
                    const res = await fetch('http://localhost:3000/api/trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ character: characterName }),
                    });
                    const data = await res.json();

                    if (data.triggerLine) {
                        const sentences = (data.triggerLine as string)
                            .split(/(?<=[.!?])\s+(?=\S)/g)
                            .map((s: string) => s.replace(/\n/g, ' ').trim())
                            .filter((s: string) => s !== '' && !/^(\.){2,}$/.test(s));


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
                        }
                    }
                } catch (e) {
                    console.error('트리거 대사 로딩 실패:', e);
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
        fontSize: 30,
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
    },
    typingBubble: {
        fontFamily: 'monospace',
        letterSpacing: 2,
        fontSize: 23,
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
