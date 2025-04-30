import React, { useLayoutEffect, useEffect, useState } from 'react';   // ← useLayoutEffect 추가
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  character: string;
  text: string;
}

const EventDialogue: React.FC<Props> = ({ character, text }) => {
  /* 캐릭터 이름·소속 분리 ------------------------------------------------ */
  const parseCharacterName = (character: string) => {
    const match = character.match(/^(.*?)\((.*?)\)$/);
    return match
      ? { name: match[1], affiliation: match[2] }
      : { name: character, affiliation: '' };
  };
  const { name, affiliation } = parseCharacterName(character);

  /* 타이핑 애니메이션용 상태 -------------------------------------------- */
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  /* 🔸 text가 바뀌면 먼저 상태를 0으로 초기화 – 화면 그리기 전에 실행 */
  useLayoutEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);                              // ← useEffect ➜ useLayoutEffect 로 변경

  /* 글자 하나씩 찍어주기 -------------------------------------------------- */
  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(index + 1);
      }, 30);                              // 글자 간 간격(ms)
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  /* ---------------------------------------------------------------------- */
  return (
    <View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.affiliation}>{affiliation}</Text>
      <Text style={styles.text}>{displayedText}</Text>
    </View>
  );
};

export default EventDialogue;

/* ------------------------------ 스타일 ---------------------------------- */
const styles = StyleSheet.create({
  name: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  affiliation: {
    fontSize: 30,
    color: '#8fd3ff',
    marginBottom: 12,
    borderBottomColor: '#ffffff',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  text: {
    fontSize: 35,
    color: '#ffffff',
    lineHeight: 28,
  },
});
