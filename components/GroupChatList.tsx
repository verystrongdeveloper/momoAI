import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface GroupChatRoom {
    id: string;
    name: string;
    members: string[];
    image: any;
    lastMessage: string;
}

interface Props {
    onEnterRoom: (groupId: string) => void;
}

const GROUP_CHAT_ROOMS: GroupChatRoom[] = [
    {
        id: 'council',
        name: '대책위원회방',
        members: ['호시노', '세리카', '노노미', '아야네', '시로코'],
        image: require('../assets/images/hoshino.jpg'),
        lastMessage: '호시노: 으헤~ 선생, 감자 폭탄은 안 터졌어!',
    },
    {
        id: 'millennium',
        name: '밀레니엄 게임부',
        members: ['아리스', '유우카'],
        image: require('../assets/images/aris.jpg'),
        lastMessage: '아리스: 유우카! 서버 비용은 왜 또...',
    },
];

const GroupChatList: React.FC<Props> = ({ onEnterRoom }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>📱 단톡방 리스트</Text>
            {GROUP_CHAT_ROOMS.map((room) => (
                <TouchableOpacity
                    key={room.id}
                    onPress={() => onEnterRoom(room.id)}
                    style={styles.entry}
                >
                    <Image source={room.image} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{room.name} ({room.members.length}명)</Text>
                        <Text style={styles.lastMessage} numberOfLines={1}>{room.lastMessage}</Text>
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
