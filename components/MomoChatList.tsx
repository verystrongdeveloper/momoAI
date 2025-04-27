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
