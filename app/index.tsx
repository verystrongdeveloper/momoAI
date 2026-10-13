import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StoryContainer from '@/components/layout/StoryContainer';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';

export default function Home() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, keyboardInset),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StoryContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FB94A7',
  },
});
