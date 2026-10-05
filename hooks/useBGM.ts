import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { musicMap } from '@/constants/eventAssets';
import { getBgmVolume, setBgmVolume, subscribeBgmVolume } from '@/services/bgmVolume';

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
  const volumeRef = useRef(getBgmVolume());
  const [volume, setVolumeState] = useState(getBgmVolume);
  const mutedRef = useRef(false);
  const [muted, setMutedState] = useState(false);
  const resumeRef = useRef<(() => void) | null>(null);

  const clearResume = useCallback(() => {
    if (resumeRef.current && typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', resumeRef.current);
      window.removeEventListener('keydown', resumeRef.current);
    }
    resumeRef.current = null;
  }, []);

  const applyVolume = useCallback(async (next: number) => {
    volumeRef.current = next;
    setVolumeState(next);
    if (!soundRef.current) return;
    try {
      await soundRef.current.setVolumeAsync(next);
    } catch {
      /* ignore */
    }
  }, []);

  const setVolume = useCallback(
    async (value: number) => {
      if (!Number.isFinite(value)) return;
      await applyVolume(setBgmVolume(value));
    },
    [applyVolume],
  );

  useEffect(() => subscribeBgmVolume((next) => void applyVolume(next)), [applyVolume]);

  const setMuted = useCallback(async (value: boolean) => {
    mutedRef.current = value;
    setMutedState(value);
    if (!soundRef.current) return;
    try {
      await soundRef.current.setIsMutedAsync(value);
    } catch {
      /* ignore */
    }
  }, []);

  /** 모든 사운드 정지 */
  const stop = useCallback(async () => {
    clearResume();
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
  }, [clearResume]);

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
        await snd.loadAsync(src, {
          isLooping: true,
          volume: volumeRef.current,
          isMuted: mutedRef.current,
        });
        soundRef.current = snd;
        currentKey.current = key;

        const armResume = () => {
          if (typeof window === 'undefined') return;
          clearResume();
          const resume = () => {
            clearResume();
            void snd.playAsync().catch(() => {});
          };
          resumeRef.current = resume;
          window.addEventListener('pointerdown', resume);
          window.addEventListener('keydown', resume);
        };

        try {
          await snd.playAsync();
        } catch {
          // 브라우저가 클릭 없이 재생을 막으면, 다음 입력에서 시작한다.
          armResume();
        }
      } finally {
        isLoadingRef.current = false; // 해제
      }
    },
    [clearResume, stop],
  );

  /** 언마운트 시 안전하게 정리 */
  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { setMusic, stop, volume, setVolume, muted, setMuted };
}
