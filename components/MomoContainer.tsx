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