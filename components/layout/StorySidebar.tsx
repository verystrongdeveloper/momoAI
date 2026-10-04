import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  /** 좁은 화면에서는 가로 탭 바로 표시 */
  horizontal?: boolean;
  active: 'characters' | 'groups';
  onOpenCharacterList: () => void;
  onOpenGroupChatList: () => void;
}

const StorySidebar: React.FC<Props> = ({ horizontal, active, onOpenCharacterList, onOpenGroupChatList }) => {
  return (
    <View style={[styles.sidebar, horizontal && styles.sidebarHorizontal]}>
      <TouchableOpacity
        onPress={onOpenCharacterList}
        style={[styles.iconBtn, active === 'characters' && styles.iconBtnActive]}
      >
        <Image source={require('../../assets/images/list.jpg')} style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenGroupChatList}
        style={[styles.iconBtn, active === 'groups' && styles.iconBtnActive]}
      >
        <Image source={require('../../assets/images/message.jpg')} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
};

export default StorySidebar;

const styles = StyleSheet.create({
  sidebar: {
    width: 60,
    backgroundColor: '#4C5B70',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  sidebarHorizontal: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  iconBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});
