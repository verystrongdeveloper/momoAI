import React from 'react';
import { View, StyleSheet } from 'react-native';
import MomoContainer from '../../components/MomoContainer';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';

const Home = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' } });
  }, [navigation]);
  return (
    <View style={styles.container}>
      <MomoContainer />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 40,
  },
});
