import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface Props {
  options: string[];
  onSelect: (option: string) => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

const EventSelection: React.FC<Props> = ({ options, onSelect }) => {
  return (
    <View style={styles.container}>
      {options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.btn}
          onPress={() => onSelect(opt)}
        >
          <Text style={styles.text}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EventSelection;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W * 0.8,
    alignSelf: 'center',
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.8)', // 반투명 흰색
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#fff',
    transform: [{ skewX: '-15deg' }], // ✅ 평행사변형 효과 추가
  },
  text: {
    color: '#000',    // 검정 텍스트
    textAlign: 'center',
    fontSize: 25,
  },
});
