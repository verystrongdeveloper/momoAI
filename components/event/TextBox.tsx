import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EventDialogue from './EventDialogue';
import { EventLine } from '@/types/EventLine';
import { useLayout } from '@/hooks/useLayout';

interface Props {
  currentLine: EventLine | null;
  lastSpoken: EventLine | null;
}

export default function TextBox({ currentLine, lastSpoken }: Props) {
  const { eventWidth, eventHeight } = useLayout();
  const styles = useMemo(() => makeStyles(eventWidth, eventHeight), [eventWidth, eventHeight]);

  const shown =
    currentLine?.type === 'narration'
      ? currentLine
      : currentLine?.type === 'selection' && currentLine.text
        ? currentLine
        : currentLine && ['dialogue', 'selection'].includes(currentLine.type)
        ? lastSpoken
        : null;

  if (!shown?.text) return null;

  return (
    <LinearGradient
      colors={['rgba(4,10,24,0.18)', 'rgba(4,10,24,0.72)', 'rgba(4,10,24,0.96)']}
      locations={[0, 0.3, 1]}
      style={styles.box}
    >
      <EventDialogue character={shown.character ?? ''} text={shown.text} />
      <View style={styles.caretWrap} pointerEvents="none">
        <Text style={styles.caret}>▾</Text>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (W: number, H: number) =>
  StyleSheet.create({
    box: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: H * 0.35,
      paddingTop: H * 0.065,
      paddingBottom: H * 0.05,
      paddingHorizontal: W * 0.055,
      zIndex: 8,
    },
    caretWrap: {
      position: 'absolute',
      right: W * 0.04,
      bottom: H * 0.04,
    },
    caret: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: Math.max(16, Math.round(H * 0.026)),
      fontWeight: '800',
    },
  });
