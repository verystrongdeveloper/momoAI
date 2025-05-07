import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';

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
          <ImageBackground
            source={require('../../assets/ui/selection_bg.png')}
            resizeMode="stretch"
            style={styles.btnBg}
          >
            <Text style={styles.text}>{opt}</Text>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EventSelection;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  btn: {
    width: '80%',           // 🔥 가로폭을 넓게 (기존 80% → 85%)
    height: 70,             // 🔥 높이 키우기 (기존 60 → 70)
    marginVertical: 10,     // 🔥 선택지 간 간격 조금 키우기
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnBg: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#334877',         // 🔥 선택지 텍스트 색감 조금 더 선명하게
    textAlign: 'center',
  },
  
});
