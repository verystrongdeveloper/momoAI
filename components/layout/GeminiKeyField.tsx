import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Button, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { getGeminiKey, getRememberApiKey, setGeminiKey, subscribeGeminiKey } from '@/services/geminiKey';

export default function GeminiKeyField() {
  const stored = useSyncExternalStore(subscribeGeminiKey, getGeminiKey, () => '');
  const storedRemember = useSyncExternalStore(subscribeGeminiKey, getRememberApiKey, () => false);
  const [value, setValue] = useState(stored);
  const [remember, setRemember] = useState(storedRemember);
  const [touched, setTouched] = useState(false);
  const dirty = value.trim() !== stored || remember !== storedRemember;

  useEffect(() => {
    if (touched) return;
    setValue(stored);
    setRemember(storedRemember);
  }, [stored, storedRemember, touched]);

  const save = () => {
    const next = value.trim();
    setGeminiKey(next, remember);
    setTouched(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Gemini API 키</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(next) => {
            setTouched(true);
            setValue(next);
          }}
          placeholder="본인 키를 입력하세요"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={save}
        />
        <Button title="저장" onPress={save} disabled={!dirty} />
      </View>
      <View style={styles.rememberRow}>
        <Text style={styles.hint}>API 키 기억하기</Text>
        <Switch
          value={remember}
          onValueChange={(next) => {
            setTouched(true);
            setRemember(next);
          }}
        />
      </View>
      <Text style={styles.hint}>
        {stored && remember
          ? '이 기기에 저장됨. 이 키로 대화합니다.'
          : stored
            ? '이번 실행에서만 사용합니다.'
            : '저장하면 채팅과 스토리에 이 키를 사용합니다.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e6ea',
    backgroundColor: '#f4f7f8',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  rememberRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: '#777',
  },
});
