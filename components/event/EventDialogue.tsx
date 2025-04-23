import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  character: string;
  text: string;
}

const EventDialogue: React.FC<Props> = ({ character, text }) => {
  const parseCharacterName = (character: string) => {
    const match = character.match(/^(.*?)\((.*?)\)$/);
    return match
      ? { name: match[1], affiliation: match[2] }
      : { name: character, affiliation: '' };
  };

  const { name, affiliation } = parseCharacterName(character);

  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex(index + 1);
      }, 30); // 글자 간 간격(ms)
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.affiliation}>{affiliation}</Text>
      <Text style={styles.text}>{displayedText}</Text>
    </View>
  );
};

export default EventDialogue;

const styles = StyleSheet.create({
  name: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  affiliation: {
    fontSize: 20,
    color: '#8fd3ff',
    marginBottom: 12,
    borderBottomColor: '#ffffff',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  text: {
    fontSize: 25,
    color: '#ffffff',
    lineHeight: 28,
  },
});
