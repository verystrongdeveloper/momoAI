import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { avatarOf } from '@/constants/characters';
import { useLayout } from '@/hooks/useLayout';
import StoryAssetPanel from '@/components/chat/StoryAssetPanel';
import { deleteStory, importStory, listStories, SavedStory, updateStory } from '@/store/storyLibrary';
import { setPendingEvent } from '@/store/eventStore';
import { insertAssetIntoScript, AssetKind } from '@/utils/insertStoryAsset';
import { downloadStory, pickStoryFile } from '@/utils/storyFile';
import { buildStoryPrompt } from '@/utils/storyPrompt';

const formatWhen = (createdAt: number) => {
  const d = new Date(createdAt);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}.${day} ${hour}:${minute}`;
};

export default function StoryLibraryList() {
  const router = useRouter();
  const { isCompact } = useLayout();
  const [stories, setStories] = useState<SavedStory[]>(() => listStories());
  const [editing, setEditing] = useState<SavedStory | null>(null);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState('');
  const selectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'momo-story-card-hover';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent =
      '[data-story-card]:hover,[data-story-card]:focus-within{border-color:#f4d3dc !important;box-shadow:0 6px 14px rgba(36,48,68,0.10) !important;}';
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (menuId == null || typeof document === 'undefined') return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-story-menu]')) return;
      setMenuId(null);
      setConfirmId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuId]);

  const open = (story: SavedStory) => {
    setMenuId(null);
    setPendingEvent(story.script);
    router.push('/event');
  };

  const toggleMenu = (id: string) => {
    setConfirmId(null);
    setMenuId((current) => (current === id ? null : id));
  };

  const startEdit = (story: SavedStory) => {
    setMenuId(null);
    setEditing(story);
    setDraft(story.script);
    setNotice('');
    selectionRef.current = { start: 0, end: 0 };
  };

  const saveEdit = () => {
    if (!editing) return;
    updateStory(editing.id, draft);
    setStories(listStories());
    setEditing(null);
  };

  const remove = (id: string) => {
    deleteStory(id);
    setConfirmId(null);
    setStories(listStories());
  };

  const copyPrompt = async () => {
    const text = buildStoryPrompt();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      setListNotice('프롬프트를 복사했습니다.');
    } catch {
      setListNotice('복사에 실패했습니다.');
    }
  };

  const loadFile = async () => {
    const text = await pickStoryFile();
    if (text == null) return;
    const script = text.trim();
    if (!script) {
      setListNotice('파일에 대본이 없습니다.');
      return;
    }
    importStory(script);
    setStories(listStories());
    setListNotice('');
  };

  const insertAsset = (kind: AssetKind, file: string) => {
    const cursor = selectionRef.current.start;
    const next = insertAssetIntoScript(draft, cursor, kind, file);
    if (!next.ok) {
      setNotice(next.notice);
      return;
    }
    selectionRef.current = { start: next.cursor, end: next.cursor };
    setDraft(next.script);
    setNotice('');
  };

  if (editing) {
    return (
      <View style={styles.container}>
        <View style={styles.editorHeader}>
          <Text style={styles.title}>스토리 수정</Text>
          <View style={styles.editorActions}>
            <TouchableOpacity onPress={() => setEditing(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}>
              <Text style={styles.saveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        <View style={styles.editorBody}>
          <TextInput
            style={styles.editor}
            value={draft}
            onChangeText={setDraft}
            onSelectionChange={(e) => {
              selectionRef.current = e.nativeEvent.selection;
            }}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <StoryAssetPanel character={editing.character} onInsert={insertAsset} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.shelf}>
        <View style={styles.header}>
          <Text style={styles.libraryTitle}>라이브러리</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={copyPrompt} style={styles.copyBtn}>
              <Text style={styles.copyText}>프롬프트 복사</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={loadFile} style={styles.loadBtn}>
              <Text style={styles.loadText}>불러오기</Text>
            </TouchableOpacity>
          </View>
        </View>
        {!!listNotice && <Text style={styles.listNotice}>{listNotice}</Text>}
        {stories.length === 0 ? (
          <Text style={styles.empty}>저장된 스토리가 없습니다.</Text>
        ) : (
          <View style={[styles.grid, isCompact && styles.gridCompact]}>
            {stories.map((story) => {
              const portrait = avatarOf(story.character);
              const menuOpen = menuId === story.id;
              return (
                <View
                  key={story.id}
                  dataSet={{ storyCard: 'true' }}
                  style={[styles.card, menuOpen && styles.cardMenuOpen]}
                >
                  <TouchableOpacity style={styles.coverHit} onPress={() => open(story)} activeOpacity={0.92}>
                    {portrait ? (
                      <Image source={portrait} style={styles.portrait} resizeMode="cover" />
                    ) : (
                      <View style={[styles.portrait, styles.portraitFallback]}>
                        <Text style={styles.fallbackText}>{story.character.slice(0, 1)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    dataSet={{ storyMenu: 'true' }}
                    accessibilityLabel="스토리 관리"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => toggleMenu(story.id)}
                    style={[styles.moreBtn, menuOpen && styles.moreBtnOpen]}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color="#5c6570" />
                  </TouchableOpacity>
                  <View style={styles.body}>
                    <Text style={styles.name} numberOfLines={2}>
                      {story.title}
                    </Text>
                    <Text style={styles.character} numberOfLines={1}>
                      {story.character}
                    </Text>
                    <Text style={styles.meta}>{formatWhen(story.createdAt)}</Text>
                  </View>
                  {menuOpen && (
                    <View dataSet={{ storyMenu: 'true' }} style={styles.menu}>
                      {confirmId === story.id ? (
                        <>
                          <Text style={styles.confirmText}>지울까요?</Text>
                          <TouchableOpacity onPress={() => remove(story.id)} style={styles.menuItem}>
                            <Text style={styles.menuDelete}>삭제</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setConfirmId(null)} style={styles.menuItem}>
                            <Text style={styles.menuKeep}>취소</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity onPress={() => startEdit(story)} style={styles.menuItem}>
                            <Text style={styles.menuText}>수정</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setMenuId(null);
                              downloadStory(story);
                            }}
                            style={styles.menuItem}
                          >
                            <Text style={styles.menuText}>추출</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setConfirmId(story.id)} style={[styles.menuItem, styles.menuItemLast]}>
                            <Text style={styles.menuDelete}>삭제</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    backgroundColor: '#f7f8fa',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 28,
    paddingVertical: 28,
    flexGrow: 1,
    boxSizing: 'border-box',
  },
  shelf: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 22,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  libraryTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  copyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e7f1fa',
  },
  copyText: {
    color: '#2d6ea8',
    fontSize: 14,
    fontWeight: '700',
  },
  loadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FB94A7',
  },
  loadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listNotice: {
    marginTop: -8,
    marginBottom: 12,
    color: '#c45b73',
    fontSize: 13,
  },
  empty: {
    color: '#999',
    fontSize: 16,
    marginTop: 24,
  },
  grid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 20,
    justifyContent: 'start',
    alignItems: 'stretch',
  },
  gridCompact: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
  },
  card: {
    width: '100%',
    minWidth: 0,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ebf0',
    overflow: 'visible',
    boxSizing: 'border-box',
    shadowColor: '#243044',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMenuOpen: {
    zIndex: 4,
  },
  coverHit: {
    width: '100%',
    aspectRatio: 1.55,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#f3d5dc',
  },
  moreBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    zIndex: 2,
  },
  moreBtnOpen: {
    backgroundColor: '#ffffff',
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 8,
    width: 132,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ebf0',
    zIndex: 3,
    shadowColor: '#243044',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuItemLast: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f6',
  },
  menuText: {
    color: '#3a4150',
    fontSize: 14,
    fontWeight: '600',
  },
  menuDelete: {
    color: '#a36a78',
    fontSize: 14,
    fontWeight: '600',
  },
  menuKeep: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmText: {
    paddingTop: 8,
    paddingHorizontal: 14,
    color: '#8a9199',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 12,
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FB94A7',
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  notice: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    color: '#c45b73',
    fontSize: 13,
  },
  editorBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 28,
    paddingBottom: 28,
    overflow: 'visible',
  },
  editor: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e6ea',
    backgroundColor: '#fff',
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
  portrait: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#f3d5dc',
  },
  portraitFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FB94A7',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16181d',
    lineHeight: 27,
  },
  character: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#FB94A7',
    lineHeight: 20,
  },
  meta: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#9aa3ad',
    lineHeight: 16,
  },
});
