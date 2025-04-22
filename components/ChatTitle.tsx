import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatTitle: React.FC = () => {
  return (
    <View style={styles.chatTitle}>
      <Text style={styles.titleText}>학생 (5)</Text>
      <View style={styles.menuIcons}>
        <Text style={styles.icon}>≡</Text>
        <Text style={styles.icon}>인연랭크</Text>
      </View>
    </View>
  );
};

export default ChatTitle;

const styles = StyleSheet.create({
  chatTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuIcons: {
    flexDirection: 'row',
    gap: 5,
  },
  icon: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 14,
  },
});
