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
        await sound.setVolumeAsync(0.5);          // 🔥 볼륨 50%로 설정 추가
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
    return () => { stop(); };
  }, [stop]);

  return { setMusic, stop };
}
