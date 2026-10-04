import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import StoryHeader from './StoryHeader';
import StorySidebar from './StorySidebar';
import ChatEntry from '@/components/chat/ChatEntry';
import CharacterChat from '@/components/chat/CharacterChat';
import GroupChat from '@/components/chat/GroupChat';
import GroupChatList from '@/components/chat/GroupChatList';
import { CHARACTERS, Character } from '@/constants/characters';
import { findRoom } from '@/constants/groupChatRooms';
import { useLayout } from '@/hooks/useLayout';

/** characters: 1:1 캐릭터 목록  |  groups: 단톡방 목록 */
type ListPanel = 'characters' | 'groups';

const StoryContainer: React.FC = () => {
  const { isCompact } = useLayout();
  const [listPanel, setListPanel] = useState<ListPanel>('characters');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  const hasDetail = selectedCharacter !== null || activeGroupId !== null;
  const detailTitle = selectedCharacter?.name ?? (activeGroupId ? findRoom(activeGroupId)?.name : undefined);

  const closeDetail = () => {
    setSelectedCharacter(null);
    setActiveGroupId(null);
  };

  const openCharacter = (char: Character) => {
    setActiveGroupId(null);
    setSelectedCharacter(char);
  };

  const openGroup = (groupId: string) => {
    setSelectedCharacter(null);
    setActiveGroupId(groupId);
  };

  const sidebar = (
    <StorySidebar
      horizontal={isCompact}
      active={listPanel}
      onOpenCharacterList={() => {
        setListPanel('characters');
        if (isCompact) closeDetail();
      }}
      onOpenGroupChatList={() => {
        setListPanel('groups');
        if (isCompact) closeDetail();
      }}
    />
  );

  const list = (
    <ScrollView
      style={[styles.list, isCompact && styles.listCompact]}
      contentContainerStyle={styles.listContent}
    >
      {listPanel === 'characters' &&
        CHARACTERS.map((char) => (
          <ChatEntry
            key={char.name}
            image={char.image}
            name={char.name}
            status={char.status}
            selected={selectedCharacter?.name === char.name}
            onSelect={() => openCharacter(char)}
          />
        ))}
      {listPanel === 'groups' && <GroupChatList activeRoomId={activeGroupId} onEnterRoom={openGroup} />}
    </ScrollView>
  );

  const detail = (
    <View style={styles.detail}>
      {selectedCharacter && (
        <CharacterChat
          key={selectedCharacter.name}
          characterName={selectedCharacter.name}
          characterImage={selectedCharacter.image}
          setGlobalLoading={setGlobalLoading}
        />
      )}
      {activeGroupId && <GroupChat key={activeGroupId} groupId={activeGroupId} />}
      {!hasDetail && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>대화할 상대를 선택하세요.</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <StoryHeader
        title={isCompact ? detailTitle : undefined}
        onBack={isCompact && hasDetail ? closeDetail : undefined}
      />

      {isCompact ? (
        <View style={styles.bodyColumn}>
          {hasDetail ? detail : (
            <>
              {sidebar}
              {list}
            </>
          )}
        </View>
      ) : (
        <View style={styles.bodyRow}>
          {sidebar}
          {list}
          {detail}
        </View>
      )}

      {globalLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default StoryContainer;

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
  containerCompact: {
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  bodyColumn: {
    flex: 1,
    backgroundColor: 'white',
  },
  list: {
    width: '32%',
    minWidth: 220,
    maxWidth: 360,
    backgroundColor: '#f4f7f8',
  },
  listCompact: {
    flex: 1,
    width: '100%',
    maxWidth: undefined,
  },
  listContent: {
    padding: 10,
    flexGrow: 1,
  },
  detail: {
    flex: 1,
    backgroundColor: 'white',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
