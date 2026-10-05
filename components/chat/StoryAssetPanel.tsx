import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { bgMap, emotionMap, expressionMap, musicMap, sfxMap } from '@/constants/eventAssets';
import { AssetKind } from '@/utils/insertStoryAsset';

type Category = AssetKind;

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'bg', label: '배경' },
  { id: 'emotion', label: '표정' },
  { id: 'music', label: '음악' },
  { id: 'sound', label: '효과음' },
  { id: 'expression', label: '연출' },
];

/** 긴 접두사를 먼저 맞춰 표정 파일을 묶는다. */
const EMOTION_GROUPS: { label: string; prefixes: string[] }[] = [
  { label: '호시노', prefixes: ['hoshino_'] },
  { label: '히나', prefixes: ['hina_'] },
  { label: '시로코', prefixes: ['shiroko_'] },
  { label: '세리카', prefixes: ['serika_'] },
  { label: '노노미', prefixes: ['nonomi_'] },
  { label: '아야네', prefixes: ['ayane_'] },
  { label: '이부키', prefixes: ['ibuki_'] },
  { label: '코하루', prefixes: ['koharu_'] },
  { label: '아리스', prefixes: ['aris_'] },
  { label: '유우카', prefixes: ['yuuka_'] },
  { label: '아코', prefixes: ['ako_'] },
  { label: '츠루기', prefixes: ['tsurugi_'] },
  { label: '로봇', prefixes: ['robot_'] },
  { label: '게헨나 학생', prefixes: ['gehenna_student_'] },
  { label: '선도부', prefixes: ['prefect_team_member_'] },
  { label: '발키리', prefixes: ['valkyrie_student_'] },
  { label: '백귀야행', prefixes: ['hyakkiyako_student_'] },
  { label: '현룡문', prefixes: ['genryumon_student_'] },
  { label: '정의실현부', prefixes: ['justice_task_force_member_'] },
  { label: '시민', prefixes: ['citizen_'] },
  { label: '적', prefixes: ['sukeban_', 'kaiser_', 'saint_', 'small_amas'] },
];

const fileName = (key: string, ext: string) => (key.endsWith(ext) ? key : `${key}${ext}`);

const BG_FILES = Object.keys(bgMap).map((key) => fileName(key, '.jpg'));
const MUSIC_FILES = ['none', ...Object.keys(musicMap)];
const SOUND_FILES = Object.keys(sfxMap);
const EXPRESSION_FILES = Object.keys(expressionMap);

const imageOf = (category: Category, file: string) => {
  if (category === 'bg') return bgMap[file.replace(/\.jpg$/i, '')];
  if (category === 'emotion') return emotionMap[file.replace(/\.png$/i, '')];
  if (category === 'expression') return expressionMap[file];
  return undefined;
};

const emotionGroups = EMOTION_GROUPS.map((group) => ({
  label: group.label,
  files: Object.keys(emotionMap)
    .filter((key) => group.prefixes.some((prefix) => key.startsWith(prefix)))
    .map((key) => fileName(key, '.png')),
})).filter((group) => group.files.length > 0);

interface Props {
  character: string;
  onInsert: (kind: AssetKind, file: string) => void;
}

export default function StoryAssetPanel({ character, onInsert }: Props) {
  const [category, setCategory] = useState<Category>('bg');
  const [owner, setOwner] = useState(() => emotionGroups.find((group) => group.label === character)?.label ?? emotionGroups[0]?.label ?? '');
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  const preview = hovered ? imageOf(category, hovered) : undefined;
  const previewSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;
    const src =
      category === 'music' && hovered && hovered !== 'none'
        ? musicMap[hovered as keyof typeof musicMap]
        : category === 'sound' && hovered
          ? sfxMap[hovered as keyof typeof sfxMap]
          : undefined;

    const stop = async (snd: Audio.Sound | null) => {
      if (!snd) return;
      try {
        await snd.stopAsync();
        await snd.unloadAsync();
      } catch {
        /* 이미 정리된 소리 */
      }
    };

    if (!src) {
      const prev = previewSound.current;
      previewSound.current = null;
      void stop(prev);
      return;
    }

    const snd = new Audio.Sound();
    previewSound.current = snd;
    void (async () => {
      try {
        await snd.loadAsync(src, { isLooping: category === 'music', volume: 1 });
        if (cancelled) {
          await stop(snd);
          return;
        }
        await snd.playAsync();
      } catch {
        /* 브라우저가 재생을 막으면 미리듣기를 건너뛴다 */
      }
    })();

    return () => {
      cancelled = true;
      if (previewSound.current === snd) previewSound.current = null;
      void stop(snd);
    };
  }, [category, hovered]);

  const files = useMemo(() => {
    const source =
      category === 'bg'
        ? BG_FILES
        : category === 'music'
          ? MUSIC_FILES
          : category === 'sound'
            ? SOUND_FILES
            : category === 'expression'
              ? EXPRESSION_FILES
              : emotionGroups.find((group) => group.label === owner)?.files ?? [];
    const q = query.trim().toLowerCase();
    return q ? source.filter((file) => file.toLowerCase().includes(q)) : source;
  }, [category, owner, query]);

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>사용 가능 에셋</Text>
      <Text style={styles.hint}>
        커서 앞에 [ 가 있을 때만 넣습니다. 같은 항목이 있으면 바꿉니다.
        {category === 'music' || category === 'sound' ? ' 이름에 올리면 들립니다.' : ''}
      </Text>
      <View style={styles.chips}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              setCategory(item.id);
              setHovered(null);
            }}
            style={[styles.chip, category === item.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, category === item.id && styles.chipTextOn]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {category === 'emotion' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ownerScroll} contentContainerStyle={styles.ownerChips}>
          {emotionGroups.map((group) => (
            <TouchableOpacity
              key={group.label}
              onPress={() => setOwner(group.label)}
              style={[styles.chip, owner === group.label && styles.chipOn]}
            >
              <Text style={[styles.chipText, owner === group.label && styles.chipTextOn]}>{group.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="이름 검색"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView style={styles.list}>
        {files.map((file) => (
          <Pressable
            key={file}
            onPress={() => onInsert(category, file)}
            onHoverIn={() => setHovered(file)}
            onHoverOut={() => setHovered((current) => (current === file ? null : current))}
            style={styles.fileBtn}
          >
            <Text style={styles.fileText}>{file}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {preview && <Image source={preview} resizeMode="contain" pointerEvents="none" style={styles.preview} />}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e6ea',
    backgroundColor: '#fff',
    padding: 12,
    overflow: 'visible',
    zIndex: 2,
  },
  preview: {
    position: 'fixed',
    left: '50%',
    top: '50%',
    width: 760,
    height: 480,
    marginLeft: -380,
    marginTop: -240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e6ea',
    backgroundColor: '#1b1e24',
    zIndex: 20,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  hint: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: '#888',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ownerScroll: {
    marginTop: 8,
    maxHeight: 36,
    flexGrow: 0,
  },
  ownerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f4f7f8',
  },
  chipOn: {
    backgroundColor: '#FB94A7',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '700',
  },
  chipTextOn: {
    color: '#fff',
  },
  search: {
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e6ea',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  fileBtn: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f4',
  },
  fileText: {
    fontSize: 12,
    color: '#333',
  },
});
