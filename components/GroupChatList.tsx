import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { GROUP_CHAT_ROOMS, GroupChatRoom } from '../constants/groupChatRooms';

interface Props {
  /** 방 진입 시 호출 – 상위(MomoContainer 등)에서 구현 */
  onEnterRoom: (groupId: string) => void;
}

const GroupChatList: React.FC<Props> = ({ onEnterRoom }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 단톡방 리스트</Text>

      {GROUP_CHAT_ROOMS.map((room: GroupChatRoom) => (
        <TouchableOpacity
          key={room.id}
          onPress={() => onEnterRoom(room.id)}
          style={styles.entry}
        >
          <Image source={room.image} style={styles.avatar} />
          <View style={{ flex: 1 }}>
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
    padding: 20,
    flex: 1,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  entry: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
