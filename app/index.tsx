import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import StoryContainer from '@/components/layout/StoryContainer';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';

export default function Home() {
  const keyboardInset = useKeyboardInset();

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: keyboardInset }]}>
      <StoryContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
});
