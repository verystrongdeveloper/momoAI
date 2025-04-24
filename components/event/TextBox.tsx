import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Dimensions } from 'react-native';
import EventDialogue from './EventDialogue';
import { EventLine } from '../types/EventLine';

const { height: H } = Dimensions.get('window');

interface Props {
  currentLine: EventLine | null;
  lastSpoken: EventLine | null;
}

/**  
 * narration이면 그대로, 그 외엔 직전 대사/나레이션 표시  
 */
export default function TextBox({ currentLine, lastSpoken }: Props) {
  return (
    <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.box}>
      {currentLine?.type === 'narration'
        ? <EventDialogue character={currentLine.character!} text={currentLine.text} />
        : lastSpoken && <EventDialogue character={lastSpoken.character!} text={lastSpoken.text} />
      }
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: H / 3,
    paddingHorizontal: 30,
    paddingTop: 32,
    paddingBottom: 12,
    paddingLeft: 100,
    paddingRight: 100,
  },
});
