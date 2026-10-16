import React, { useSyncExternalStore } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { getGreetMode, setGreetMode, subscribeGreetMode } from '@/services/greetMode';
import { useI18n } from '@/i18n';

export default function GreetModeToggle() {
  const { t } = useI18n();
  const on = useSyncExternalStore(subscribeGreetMode, getGreetMode, () => false);

  const toggle = (next: boolean) => {
    setGreetMode(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('greetFirst')}</Text>
        <Switch value={on} onValueChange={toggle} />
      </View>
      <Text style={styles.hint}>{on ? t('greetOn') : t('greetOff')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e6ea',
    backgroundColor: '#f4f7f8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  hint: {
    marginTop: 2,
    fontSize: 12,
    color: '#777',
  },
});
