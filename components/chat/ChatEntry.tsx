import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  image: ImageSourcePropType;
  name: string;
  status: string;
  selected?: boolean;
  onSelect: () => void;
}

const ChatEntry: React.FC<Props> = ({ image, name, status, selected, onSelect }) => {
  return (
    <TouchableOpacity onPress={onSelect} style={[styles.entry, selected && styles.entrySelected]}>
      <Image source={image} style={styles.avatar} />
      <View style={styles.texts}>
        <Text style={styles.name}>{name}</Text>
        {!!status && (
          <Text style={styles.status} numberOfLines={1}>
            {status}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ChatEntry;

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderRadius: 6,
  },
  entrySelected: {
    backgroundColor: '#e6ecf0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 5,
    resizeMode: 'cover',
  },
  texts: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
});
