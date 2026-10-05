import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { getGreetMode, setGreetMode } from '@/services/greetMode';

export default function GreetModeToggle() {
  const [on, setOn] = useState(getGreetMode);

  const toggle = (next: boolean) => {
    setGreetMode(next);
    setOn(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>먼저 말 걸기</Text>
        <Switch value={on} onValueChange={toggle} />
      </View>
      <Text style={styles.hint}>{on ? '방에 들어가면 먼저 말을 겁니다.' : '꺼 두면 먼저 말을 걸지 않습니다.'}</Text>
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
