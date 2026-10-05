import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  /** 좁은 화면에서는 아래쪽 가로 탭 바로 표시 */
  horizontal?: boolean;
  active: 'characters' | 'groups' | 'library' | 'settings';
  onOpenCharacterList: () => void;
  onOpenGroupChatList: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
}

const StorySidebar: React.FC<Props> = ({
  horizontal,
  active,
  onOpenCharacterList,
  onOpenGroupChatList,
  onOpenLibrary,
  onOpenSettings,
}) => {
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

      <TouchableOpacity
        onPress={onOpenLibrary}
        style={[styles.iconBtn, active === 'library' && styles.iconBtnActive]}
      >
        <View style={styles.libraryIcon}>
          <Ionicons name="library-outline" size={28} color="#ffffff" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenSettings}
        style={[styles.iconBtn, active === 'settings' && styles.iconBtnActive]}
      >
        <View style={styles.libraryIcon}>
          <Ionicons name="settings-outline" size={28} color="#ffffff" />
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexShrink: 0,
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
  libraryIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
