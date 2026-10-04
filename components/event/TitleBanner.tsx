import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useLayout } from '@/hooks/useLayout';

interface Props {
  title: string;
  visible: boolean;
}

const TitleBanner: React.FC<Props> = ({ title, visible }) => {
  const { eventHeight, scale } = useLayout();
  const styles = useMemo(() => makeStyles(scale), [scale]);
  const opacity = useRef(new Animated.Value(0)).current;
  const boxHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(boxHeight, { toValue: eventHeight / 4, duration: 500, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  }, [visible, eventHeight, opacity, boxHeight]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.box, { height: boxHeight }]}>
        <Text style={styles.text}>{title}</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default TitleBanner;

const makeStyles = (scale: number) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
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
      fontSize: 48 * scale,
      fontWeight: 'bold',
      color: '#556390',
      textAlign: 'center',
    },
  });
