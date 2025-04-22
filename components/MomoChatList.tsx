import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CharacterChat from './CharacterChat';

interface Character {
  name: string;
  image: any; // require('../assets/images/xxx.jpg') 형태
}

const MomoChatList: React.FC<{ selectedCharacter: Character | null; setGlobalLoading?: (value: boolean) => void; }> = ({ selectedCharacter, setGlobalLoading }) => {
  if (!selectedCharacter) {
    return <Text style={styles.notice}>👈 채팅할 캐릭터를 선택해주세요.</Text>;
  }

  return (
    <View style={styles.chatContainer}>
      <Text style={styles.title}>{selectedCharacter.name}와의 대화</Text>
      <CharacterChat
        characterName={selectedCharacter.name}
        characterImage={selectedCharacter.image}
        setGlobalLoading={setGlobalLoading}
      />
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
