import React, { useMemo } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFonts } from 'expo-font';
import { storyFont, useLayout } from '@/hooks/useLayout';

const SELECTION_BACKGROUND = require('../../assets/ui/selection_bg.png');

interface Props {
  options: string[];
  onSelect: (option: string) => void;
}

const labelOf = (opt: string) => opt.trim().replace(/^["“”]+|["“”]+$/g, '');

const EventSelection: React.FC<Props> = ({ options, onSelect }) => {
  const { eventWidth, eventHeight } = useLayout();
  const [fontLoaded] = useFonts({
    PretendardSemiBold: require('../../assets/fonts/Pretendard-SemiBold.ttf'),
  });
  const styles = useMemo(
    () => makeStyles(eventWidth, eventHeight, fontLoaded),
    [eventWidth, eventHeight, fontLoaded]
  );

  return (
    <View style={styles.container}>
      {options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.btn}
          onPress={() => onSelect(opt)}
          activeOpacity={0.82}
        >
          <ImageBackground
            source={SELECTION_BACKGROUND}
            resizeMode="stretch"
            style={styles.buttonSurface}
            imageStyle={styles.buttonImage}
          >
            <Text style={styles.text} numberOfLines={2}>
              {labelOf(opt)}
            </Text>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EventSelection;

const makeStyles = (W: number, H: number, fontLoaded: boolean) =>
  {
    // 짧은 변을 기준으로 잡아, 세로로 긴 화면에서 박스가 캐릭터를 덮지 않게 한다.
    const short = Math.min(W, H);
    const cardWidth = Math.min(W * 0.62, short * 1.7);

    return StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'center',
      gap: Math.max(4, Math.round(short * 0.012)),
    },
    btn: {
      width: cardWidth,
      height: Math.max(40, Math.round(short * 0.068)),
    },
    buttonSurface: {
      flex: 1,
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: cardWidth * 0.05,
    },
    buttonImage: {
      borderRadius: 3,
    },
    text: {
      // SemiBold 파일 자체를 쓴다. fontWeight를 올리면 윈도우가 굵기를 합성해
      // 한글 자간이 들쭉날쭉하고 획이 번진다.
      fontFamily: fontLoaded
        ? 'PretendardSemiBold, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif'
        : '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
      fontSize: storyFont(W, H, 0.026, 16),
      fontWeight: '400',
      color: '#263f5d',
      textAlign: 'center',
    },
    });
  };
