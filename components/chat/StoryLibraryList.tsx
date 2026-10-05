import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { avatarOf } from '@/constants/characters';
import { useLayout } from '@/hooks/useLayout';
import StoryAssetPanel from '@/components/chat/StoryAssetPanel';
import { deleteStory, importStory, listStories, SavedStory, updateStory } from '@/store/storyLibrary';
import { setPendingEvent } from '@/store/eventStore';
import { insertAssetIntoScript, AssetKind } from '@/utils/insertStoryAsset';
import { downloadStory, pickStoryFile } from '@/utils/storyFile';

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
  const [listNotice, setListNotice] = useState('');
  const selectionRef = useRef({ start: 0, end: 0 });

  const open = (story: SavedStory) => {
    setPendingEvent(story.script);
    router.push('/event');
  };

  const startEdit = (story: SavedStory) => {
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
        <View style={styles.header}>
          <Text style={styles.libraryTitle}>라이브러리</Text>
          <TouchableOpacity onPress={loadFile} style={styles.loadBtn}>
            <Text style={styles.loadText}>불러오기</Text>
          </TouchableOpacity>
        </View>
        {!!listNotice && <Text style={styles.listNotice}>{listNotice}</Text>}
        {stories.length === 0 ? (
          <Text style={styles.empty}>저장된 스토리가 없습니다.</Text>
        ) : (
          <View style={styles.grid}>
            {stories.map((story) => {
              const portrait = avatarOf(story.character);
              return (
                <View key={story.id} style={[styles.card, isCompact && styles.cardFill]}>
                  <TouchableOpacity style={styles.cardMain} onPress={() => open(story)}>
                    {portrait ? (
                      <Image source={portrait} style={styles.portrait} />
                    ) : (
                      <View style={[styles.portrait, styles.portraitFallback]}>
                        <Text style={styles.fallbackText}>{story.character.slice(0, 1)}</Text>
                      </View>
                    )}
                    <View style={styles.body}>
                      <Text style={styles.name} numberOfLines={2}>
                        {story.title}
                      </Text>
                      <Text style={styles.character} numberOfLines={1}>
                        {story.character}
                      </Text>
                      <Text style={styles.meta}>{formatWhen(story.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  {confirmId === story.id ? (
                    <View style={styles.actions}>
                      <Text style={styles.confirmText}>지울까요?</Text>
                      <TouchableOpacity onPress={() => remove(story.id)} style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>삭제</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setConfirmId(null)} style={styles.keepBtn}>
                        <Text style={styles.keepText}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.actions}>
                      <TouchableOpacity onPress={() => startEdit(story)} style={styles.editBtn}>
                        <Text style={styles.editText}>수정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => downloadStory(story)} style={styles.exportBtn}>
                        <Text style={styles.exportText}>추출</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setConfirmId(story.id)} style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: 360,
    maxWidth: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eceff3',
    boxSizing: 'border-box',
  },
  cardFill: {
    width: '100%',
    alignSelf: 'stretch',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actions: {
    width: 76,
    flexShrink: 0,
    alignItems: 'stretch',
    gap: 6,
  },
  editBtn: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff0f3',
    boxSizing: 'border-box',
  },
  editText: {
    color: '#e06a86',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  exportBtn: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#e7f1fa',
    boxSizing: 'border-box',
  },
  exportText: {
    color: '#2d6ea8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteBtn: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0c9d1',
    boxSizing: 'border-box',
  },
  deleteText: {
    color: '#c45b73',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmText: {
    color: '#c45b73',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  keepBtn: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    boxSizing: 'border-box',
  },
  keepText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
    width: 88,
    height: 88,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: '#f3d5dc',
  },
  portraitFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FB94A7',
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 23,
  },
  character: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#FB94A7',
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: '#8a9199',
  },
});
