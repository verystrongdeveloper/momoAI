import { StyleSheet } from 'react-native';

/** 설정 미리보기와 실제 채팅에 같은 배율을 사용한다. */
export function makeChatSizeStyles(size: number) {
  const scaled = (value: number) => Math.round(value * size);
  return StyleSheet.create({
    messageRow: { marginVertical: scaled(4) },
    avatarWrapper: { width: scaled(50), marginRight: scaled(6) },
    avatar: { width: scaled(50), height: scaled(50), borderRadius: scaled(18) },
    charName: { fontSize: scaled(15) },
    bubble: { fontSize: scaled(16), lineHeight: scaled(22), padding: scaled(10), borderRadius: scaled(12) },
    input: { fontSize: scaled(16), paddingHorizontal: scaled(10), paddingVertical: scaled(8) },
    eventLabel: { fontSize: scaled(13) },
    eventButtonText: { fontSize: scaled(15) },
  });
}
