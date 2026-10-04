import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import StoryContainer from '@/components/layout/StoryContainer';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
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
