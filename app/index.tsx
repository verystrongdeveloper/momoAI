import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StoryContainer from '@/components/layout/StoryContainer';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';

export default function Home() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: keyboardInset > 0 ? 0 : insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StoryContainer />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FB94A7',
  },
});
