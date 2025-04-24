import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import EventPlayer from '../components/event/EventPlayer'; // 경로는 프로젝트 구조에 따라 조정해줘

export default function EventScreen() {
    // ② AFTER
    const { script } = useLocalSearchParams();
    if (typeof script !== 'string') return null;   // 안전 가드
    return <EventPlayer script={script} />;        // ✅ 그대로 전달

}
