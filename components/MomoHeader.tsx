import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

const MomoHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrapper}>
        <Image source={require('../assets/images/logo.jpg')} style={styles.logo} />
      </View>

      <TouchableOpacity>
        <Text style={styles.closeBtn}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MomoHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FB94A7',
  },

  logoWrapper: {
    flex: 1,
    alignItems: 'flex-start', // 왼쪽 정렬
  },

  logo: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 5,
  },

  closeBtn: {
    fontSize: 28,
    color: 'white',
  },

});
