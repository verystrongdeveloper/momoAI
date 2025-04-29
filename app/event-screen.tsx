import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import EventPlayer from '../components/event/EventPlayer';   // ← 경로는 프로젝트 구조에 맞게 조정

export default function EventScreen() {
  const { script } = useLocalSearchParams();

  // 쿼리 파라미터가 없거나 타입이 맞지 않는 경우 안전 가드
  if (typeof script !== 'string') return null;

  /*  ✅  decodeURIComponent 필요 없음
      CharacterChat에서 encodeURIComponent를 이미 제거했으므로
      expo‑router가 한 번만 자동 인코딩/디코딩해 줍니다. */
      return (
        <>
          <Stack.Screen options={{ headerShown: false }} />  {/* ✨ 이거 추가 */}
          <EventPlayer script={script} />
        </>
      );
}
