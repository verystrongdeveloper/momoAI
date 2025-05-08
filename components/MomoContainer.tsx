// MomoContainer.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MomoHeader from './MomoHeader';
import MomoSidebar from './MomoSidebar';
import MomoChatList from './MomoChatList';
import ChatEntry from './ChatEntry';

interface Character {
  name: string;
  status: string;
  image: any;
}

const characters = [
  {
    name: '시로코',
    status: '싸이클링 파티 모집 중…(1/5)',
    image: require('../assets/images/shiroko.jpg'),
  },
  {
    name: '호시노',
    status: '낮잠 중 방해금지',
    image: require('../assets/images/hoshino.jpg'),
  },
  {
    name: '세리카',
    status: '대책위원회 쿠로미 세리카입니다',
    image: require('../assets/images/serika.jpg'),
  },
  {
    name: '노노미',
    status: '즐거운 하루 되세요!',
    image: require('../assets/images/nonomi.jpg'),
  },
  {
    name: '아야네',
    status: '상식이 존중받는 동아리, 대책...',
    image: require('../assets/images/ayane.jpg'),
  },
  {
    name: '히나',
    status: '',
    image: require('../assets/images/hina.jpg'), // 이미지 경로 추가 필요
  },
  {
    name: '이부키',
    status: '게헨나 학원의 이부키입니다!',
    image: require('../assets/images/ibuki.jpg'), 
  },
  {
    name: '코하루',
    status: '야한 건 안 된다고 생각해!',
    image: require('../assets/images/koharu.jpg'),
  },
];



const MomoContainer: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false); // ✅ 전역 로딩 상태 추가

  return (
    <View style={styles.container}>
      <MomoHeader />
      <View style={styles.body}>
        <MomoSidebar />

        {/* 왼쪽: 캐릭터 리스트 */}
        <View style={styles.chatList}>
          {characters.map((char) => (
            <ChatEntry
              key={char.name}
              image={char.image}
              name={char.name}
              status={char.status}
              onSelect={() => setSelectedCharacter(char)}
            />
          ))}
        </View>

        {/* 오른쪽: 선택된 캐릭터의 채팅 */}
        <MomoChatList
          selectedCharacter={selectedCharacter}
          setGlobalLoading={setGlobalLoading} // ✅ 전달
        />
      </View>

      {/* ✅ 전역 로딩 오버레이 */}
      {globalLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default MomoContainer;

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
  // ✅ 로딩 오버레이 스타일
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
