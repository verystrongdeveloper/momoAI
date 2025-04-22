import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const MomoSidebar: React.FC = () => {
  return (
    <View style={styles.sidebar}>
      <Image source={require('../assets/images/list.jpg')} style={styles.icon} />
      <Image source={require('../assets/images/message.jpg')} style={styles.icon} />
    </View>
  );
};

export default MomoSidebar;

const styles = StyleSheet.create({
  sidebar: {
    width: 60,
    backgroundColor: '#4C5B70',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 5,
  },
});
