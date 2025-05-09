export interface GroupChatRoom {
    id: string;
    name: string;
    members: string[];
    image: any;
    lastMessage: string;
  }
  
  /** 단톡방 기본 목록 – 필요 시 JSON·백엔드 연동으로 대체 */
  export const GROUP_CHAT_ROOMS: GroupChatRoom[] = [
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
  