import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { musicMap } from '../constants/eventAssets';

/**
 * BGM 재생 전용 훅
 *  - 한 번에 한 트랙만 재생
 *  - 다른 트랙으로 교체 시 자동으로 기존 사운드 stop + unload
 *  - 'none' 키를 넘기면 즉시 정지
 */
export default function useBGM() {
  /** 현재 재생 중인 사운드 객체 */
  const soundRef = useRef<Audio.Sound | null>(null);
  /** 현재 재생 중인 파일명(중복 재생 방지) */
  const currentKey = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  /** 모든 사운드 정지 */
  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        /* ignore */
      }
      soundRef.current = null;
      currentKey.current = null;
    }
  }, []);

  /**
   * 새 BGM 지정
   * @param key  음악 파일명(ext 포함) ― 'none' 이면 정지만
   */
  const setMusic = useCallback(
    async (key: string | 'none') => {
      if (isLoadingRef.current) return; // 중복 방지 🔒
      isLoadingRef.current = true;

      try {
        if (key === currentKey.current) return;

        await stop();
        if (key === 'none') return;

        const src = musicMap[key as keyof typeof musicMap];
        if (!src) {
          console.warn(`[useBGM] 존재하지 않는 음악 키: ${key}`);
          return;
        }

        const snd = new Audio.Sound();
        await snd.loadAsync(src, { isLooping: true });
        await snd.playAsync();

        soundRef.current = snd;
        currentKey.current = key;
      } finally {
        isLoadingRef.current = false; // 해제
      }
    },
    [stop],
  );

  /** 언마운트 시 안전하게 정리 */
  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { setMusic, stop };
}
