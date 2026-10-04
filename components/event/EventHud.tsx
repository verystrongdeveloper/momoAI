import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLayout } from '@/hooks/useLayout';

interface Props {
  auto: boolean;
  onToggleAuto: () => void;
  onMenu: () => void;
}

const EventHud: React.FC<Props> = ({ auto, onToggleAuto, onMenu }) => {
  const { eventWidth, eventHeight } = useLayout();
  const styles = useMemo(() => makeStyles(eventWidth, eventHeight), [eventWidth, eventHeight]);

  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.btn, auto && styles.btnOn]} onPress={onToggleAuto}>
        <Text style={[styles.text, auto && styles.textOn]}>AUTO</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onMenu}>
        <Text style={styles.text}>MENU</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EventHud;

const makeStyles = (W: number, H: number) =>
  StyleSheet.create({
    row: {
      position: 'absolute',
      top: H * 0.042,
      right: W * 0.03,
      flexDirection: 'row',
      gap: W * 0.014,
      zIndex: 20,
    },
    btn: {
      minWidth: Math.max(72, W * 0.09),
      height: Math.max(32, H * 0.055),
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.96)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      shadowColor: '#0b1830',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    btnOn: {
      backgroundColor: '#d8ebff',
    },
    text: {
      fontSize: Math.max(12, Math.round(H * 0.021)),
      fontWeight: '800',
      color: '#385373',
      letterSpacing: 0.7,
    },
    textOn: {
      color: '#2d6ea8',
    },
  });
