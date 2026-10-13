import type { ImageSourcePropType } from 'react-native';
import rooms from '../shared/groupRooms.json';
import { avatarOf } from './characters';

export interface GroupChatRoom {
  id: string;
  name: string;
  members: string[];
  image: ImageSourcePropType;
  lastMessage: string;
}

type RoomFile = {
  id: string;
  name: string;
  members: string[];
  lastMessage: string;
};

/** 단톡방 정의는 shared/groupRooms.json 한 곳에서 관리하며 서버와 공유한다. 멤버는 에셋이 있는 캐릭터만 넣는다. */
export const GROUP_CHAT_ROOMS: GroupChatRoom[] = (rooms as RoomFile[]).map((room) => ({
  ...room,
  image: avatarOf(room.members[0]) ?? avatarOf('호시노')!,
}));

export function findRoom(id: string): GroupChatRoom | undefined {
  return GROUP_CHAT_ROOMS.find((room) => room.id === id);
}
