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
  // narration이면 텍스트 있음, dialogue/selection이면 직전 대사 유지
  const shouldShow =
    (currentLine?.type === 'narration' && currentLine.text) ||
    (['dialogue', 'selection'].includes(currentLine?.type ?? '') && lastSpoken?.text);

  if (!shouldShow) return null;

  return (
    <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.box}>
      {currentLine?.type === 'narration'
        ? <EventDialogue character={currentLine.character!} text={currentLine.text ?? ''} />
        : lastSpoken && <EventDialogue character={lastSpoken.character!} text={lastSpoken.text ?? ''} />
      }
    </LinearGradient>
  );
}



const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: H / 2.5,
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 12,
    paddingLeft: 100,
    paddingRight: 100,
  },
});
