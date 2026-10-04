import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { getGeminiKey, setGeminiKey } from '@/services/geminiKey';

export default function GeminiKeyField() {
  const [value, setValue] = useState(getGeminiKey);
  const [stored, setStored] = useState(getGeminiKey);
  const dirty = value.trim() !== stored;

  const save = () => {
    const next = value.trim();
    setGeminiKey(next);
    setValue(next);
    setStored(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Gemini API 키</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="본인 키를 입력하세요"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={save}
        />
        <Button title="저장" onPress={save} disabled={!dirty} />
      </View>
      <Text style={styles.hint}>
        {stored ? '이 브라우저에 저장됨. 이 키로 대화합니다.' : '저장하면 채팅과 스토리에 이 키를 사용합니다.'}
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
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: '#777',
  },
});
