import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GROUP_CHAT_ROOMS } from '@/constants/groupChatRooms';

interface Props {
  activeRoomId: string | null;
  onEnterRoom: (groupId: string) => void;
}

const GroupChatList: React.FC<Props> = ({ activeRoomId, onEnterRoom }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>단톡방</Text>

      {GROUP_CHAT_ROOMS.map((room) => (
        <TouchableOpacity
          key={room.id}
          onPress={() => onEnterRoom(room.id)}
          style={[styles.entry, activeRoomId === room.id && styles.entryActive]}
        >
          <Image source={room.image} style={styles.avatar} />
          <View style={styles.texts}>
            <Text style={styles.name}>
              {room.name} ({room.members.length}명)
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {room.lastMessage}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default GroupChatList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  entry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderRadius: 6,
  },
  entryActive: {
    backgroundColor: '#e6ecf0',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  texts: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
