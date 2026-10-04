import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLayout } from '@/hooks/useLayout';

interface Props {
  character: string;
  text: string;
}

const TYPEWRITER_MS = 30;

/** "이름(소속)" 형태의 화자 문자열을 분리 */
const parseSpeaker = (character: string) => {
  const match = character.match(/^(.*?)\((.*?)\)$/);
  return match ? { name: match[1], affiliation: match[2] } : { name: character, affiliation: '' };
};

const EventDialogue: React.FC<Props> = ({ character, text }) => {
  const { eventHeight } = useLayout();
  const styles = useMemo(() => makeStyles(eventHeight), [eventHeight]);
  const { name, affiliation } = parseSpeaker(character);

  const [shown, setShown] = useState(0);

  useLayoutEffect(() => setShown(0), [text]);

  useEffect(() => {
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), TYPEWRITER_MS);
    return () => clearTimeout(t);
  }, [shown, text]);

  return (
    <View style={styles.wrap}>
      {!!name && (
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          {!!affiliation && <Text style={styles.affiliation}>{affiliation}</Text>}
        </View>
      )}
      {!!name && <View style={styles.rule} />}
      <Text style={styles.text}>{text.slice(0, shown)}</Text>
    </View>
  );
};

export default EventDialogue;

const makeStyles = (H: number) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    name: {
      fontSize: Math.max(22, Math.round(H * 0.044)),
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.2,
    },
    affiliation: {
      fontSize: Math.max(16, Math.round(H * 0.027)),
      fontWeight: '800',
      color: '#6fc5ee',
    },
    rule: {
      marginTop: Math.round(H * 0.01),
      marginBottom: Math.round(H * 0.018),
      height: 1,
      width: '42%',
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    text: {
      fontSize: Math.max(20, Math.round(H * 0.04)),
      lineHeight: Math.max(28, Math.round(H * 0.056)),
      color: '#ffffff',
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });
