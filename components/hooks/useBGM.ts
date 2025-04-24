import { useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { musicMap } from '../constants/eventAssets';

export default function useBGM() {
  const bgmRef = useRef<Audio.Sound | null>(null);
  const prevKey = useRef<string | null>(null);

  /* ───── 정지 ───── */
  const stop = useCallback(async () => {
    if (bgmRef.current) {
      try {
        await bgmRef.current.stopAsync();
        await bgmRef.current.unloadAsync();
      } catch {}
      bgmRef.current = null;
      prevKey.current = null;
    }
  }, []);

  /* ───── 새 음악 설정 ───── */
  const setMusic = useCallback(
    async (key?: string | null) => {
      if (!key || key === 'none') {
        await stop();
        return;
      }
      if (prevKey.current === key) return;

      await stop();
      const sound = new Audio.Sound();
      try {
        // ↓ 방법 A : musicMap 을 Record<string, any> 로 바꿨다면 그대로 사용
        await sound.loadAsync(musicMap[key]);
        // ↓ 방법 B : 엄격타입 유지 시
        // await sound.loadAsync(musicMap[key as keyof typeof musicMap]);

        await sound.setIsLoopingAsync(true);
        await sound.playAsync();
        bgmRef.current = sound;
        prevKey.current = key;
      } catch (e) {
        console.warn('[BGM] load error', e);
      }
    },
    [stop],
  );

  /* 언마운트 시 BGM 정리 */
  useEffect(() => {
    // ① clean-up 래퍼로 감싸서 void 반환
    return () => { stop(); };   // ← 여기만 변경
    // 또는: return () => { void stop(); };
  }, [stop]);

  return { setMusic, stop };
}
