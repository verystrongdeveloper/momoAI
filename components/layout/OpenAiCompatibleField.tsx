import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Button, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { getOpenAiApiKey, getSetting, subscribeStorage } from '@/storage';
import { saveOpenAiConfig } from '@/services/aiSettings';
import { useI18n } from '@/i18n';

export default function OpenAiCompatibleField({ onFocus }: { onFocus?: () => void }) {
  const { t } = useI18n();
  const storedKey = useSyncExternalStore(subscribeStorage, getOpenAiApiKey, () => '');
  const storedRemember = useSyncExternalStore(subscribeStorage, () => getSetting('rememberOpenAiApiKey'), () => false);
  const storedBaseUrl = useSyncExternalStore(subscribeStorage, () => getSetting('openAiBaseUrl'), () => 'https://api.openai.com/v1');
  const storedModel = useSyncExternalStore(subscribeStorage, () => getSetting('openAiModel'), () => '');
  const [apiKey, setApiKey] = useState(storedKey);
  const [remember, setRemember] = useState(storedRemember);
  const [baseUrl, setBaseUrl] = useState(storedBaseUrl);
  const [model, setModel] = useState(storedModel);
  const [touched, setTouched] = useState(false);
  const dirty = apiKey.trim() !== storedKey || remember !== storedRemember ||
    baseUrl.trim() !== storedBaseUrl || model.trim() !== storedModel;

  useEffect(() => {
    if (touched) return;
    setApiKey(storedKey);
    setRemember(storedRemember);
    setBaseUrl(storedBaseUrl);
    setModel(storedModel);
  }, [storedKey, storedRemember, storedBaseUrl, storedModel, touched]);

  const save = () => {
    saveOpenAiConfig({ apiKey, rememberApiKey: remember, baseUrl, model });
    setTouched(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('openAiApiKey')}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={(next) => { setTouched(true); setApiKey(next); }}
          placeholder={t('apiKeyPlaceholder')}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onSubmitEditing={save}
        />
        <Button title={t('save')} onPress={save} disabled={!dirty} />
      </View>
      <Text style={styles.label}>{t('baseUrl')}</Text>
      <TextInput
        style={styles.inputFull}
        value={baseUrl}
        onChangeText={(next) => { setTouched(true); setBaseUrl(next); }}
        placeholder="https://api.openai.com/v1"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onFocus={onFocus}
      />
      <Text style={styles.hint}>{t('openAiBaseUrlHint')}</Text>
      <Text style={styles.label}>{t('modelId')}</Text>
      <TextInput
        style={styles.inputFull}
        value={model}
        onChangeText={(next) => { setTouched(true); setModel(next); }}
        placeholder={t('modelIdPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={onFocus}
        onSubmitEditing={save}
      />
      <View style={styles.rememberRow}>
        <Text style={styles.hint}>{t('rememberKey')}</Text>
        <Switch
          value={remember}
          onValueChange={(next) => { setTouched(true); setRemember(next); }}
        />
      </View>
      <Text style={styles.hint}>
        {storedKey && storedRemember ? t('keySaved') : storedKey ? t('keySession') : t('keyRequired')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e6ea', backgroundColor: '#f4f7f8' },
  label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#aaa', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff', fontSize: 14 },
  inputFull: { borderWidth: 1, borderColor: '#aaa', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', fontSize: 14 },
  rememberRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { marginTop: 6, fontSize: 12, color: '#777' },
});
