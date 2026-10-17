import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useLayout } from '@/hooks/useLayout';
import { EVENT_TIMING } from '@/utils/eventPresentation';

interface Props {
  title: string;
  visible: boolean;
}

const TitleBanner: React.FC<Props> = ({ title, visible }) => {
  const { eventWidth, eventHeight, scale, isCompact } = useLayout();
  const fontSize = isCompact ? Math.min(36, Math.max(28, Math.round(eventWidth * 0.082))) : 48 * scale;
  const bannerHeight = isCompact ? Math.round(fontSize * 2.6 + 28) : eventHeight / 4;
  const styles = useMemo(() => makeStyles(fontSize), [fontSize]);
  const opacity = useRef(new Animated.Value(0)).current;
  const boxHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: EVENT_TIMING.titleReveal * 1000, useNativeDriver: false }),
        Animated.timing(boxHeight, { toValue: bannerHeight, duration: EVENT_TIMING.titleReveal * 1000, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: EVENT_TIMING.titleFade * 1000, useNativeDriver: false }).start();
    }
  }, [visible, bannerHeight, opacity, boxHeight]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.box, { height: boxHeight }]}>
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default TitleBanner;

const makeStyles = (fontSize: number) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
    },
    box: {
      width: '100%',
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: '#ccc',
      overflow: 'hidden',
      paddingHorizontal: 16,
    },
    text: {
      fontSize,
      lineHeight: Math.round(fontSize * 1.35),
      fontWeight: 'bold',
      color: '#556390',
      textAlign: 'center',
    },
  });
