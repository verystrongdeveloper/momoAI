import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';

interface Props {
  auto: boolean;
  onToggleAuto: () => void;
  onMenu: () => void;
}

const EventHud: React.FC<Props> = ({ auto, onToggleAuto, onMenu }) => {
  const { eventWidth, eventHeight } = useLayout();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(eventWidth, eventHeight, insets.top),
    [eventWidth, eventHeight, insets.top],
  );

  return (
    <>
      <View style={styles.markWrap} pointerEvents="none">
        <Text style={styles.mark}>MomoStory</Text>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, auto && styles.btnOn]} onPress={onToggleAuto}>
          <Text style={[styles.text, auto && styles.textOn]}>AUTO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onMenu}>
          <Text style={styles.text}>MENU</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default EventHud;

const makeStyles = (W: number, H: number, topInset: number) =>
  StyleSheet.create({
    markWrap: {
      position: 'absolute',
      top: Math.max(H * 0.042, topInset + 8),
      left: W * 0.03,
      height: Math.max(32, H * 0.055),
      justifyContent: 'center',
      zIndex: 20,
    },
    mark: {
      color: 'rgba(255,255,255,0.88)',
      fontSize: Math.max(14, Math.round(H * 0.024)),
      fontWeight: '700',
      letterSpacing: 0.6,
      textShadowColor: 'rgba(0,0,0,0.55)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    row: {
      position: 'absolute',
      top: Math.max(H * 0.042, topInset + 8),
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
