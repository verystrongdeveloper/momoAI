import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { musicMap } from '@/constants/eventAssets';
import { listenForPlaybackFocus, listenForPlaybackUnlock } from '@/platform/audio';
import { playbackOnFocusChange } from '@/platform/playbackFocus';
import { getBgmVolume, setBgmVolume, subscribeBgmVolume } from '@/services/bgmVolume';

/**
 * BGM 재생 전용 훅
 *  - 한 번에 한 트랙만 재생
 *  - 다른 트랙으로 교체 시 자동으로 기존 사운드 stop + unload
 *  - 'none' 키를 넘기면 즉시 정지
 */
export default function useBGM() {
  /** 현재 재생 중인 사운드 객체 */
  const soundRef = useRef<AudioPlayer | null>(null);
  /** 현재 재생 중인 파일명(중복 재생 방지) */
  const currentKey = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const volumeRef = useRef(getBgmVolume());
  const [volume, setVolumeState] = useState(getBgmVolume);
  const mutedRef = useRef(false);
  const [muted, setMutedState] = useState(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const pausedByLifecycle = useRef(false);

  const clearResume = useCallback(() => {
    resumeRef.current?.();
    resumeRef.current = null;
  }, []);

  const applyVolume = useCallback(async (next: number) => {
    volumeRef.current = next;
    setVolumeState(next);
    if (!soundRef.current) return;
    try {
      soundRef.current.volume = next;
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
      soundRef.current.muted = value;
    } catch {
      /* ignore */
    }
  }, []);

  /** 모든 사운드 정지 */
  const stop = useCallback(async () => {
    clearResume();
    pausedByLifecycle.current = false;
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.remove();
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

        const snd = createAudioPlayer(src);
        snd.loop = true;
        snd.volume = volumeRef.current;
        snd.muted = mutedRef.current;
        soundRef.current = snd;
        currentKey.current = key;

        const armResume = () => {
          clearResume();
          resumeRef.current = listenForPlaybackUnlock(() => {
            resumeRef.current = null;
            try {
              snd.play();
            } catch {
              /* ignore */
            }
          });
        };

        try {
          snd.play();
          // 웹은 play()가 막혀도 예외를 던지지 않고 paused로 남는다.
          if (snd.paused) armResume();
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

  useEffect(() => {
    return listenForPlaybackFocus(
      () => {
        const snd = soundRef.current;
        const next = playbackOnFocusChange('active', snd != null, pausedByLifecycle.current);
        pausedByLifecycle.current = next.pausedByLifecycle;
        if (next.command === 'resume' && snd) {
          try {
            snd.play();
          } catch {
            /* ignore */
          }
        }
      },
      () => {
        const snd = soundRef.current;
        const next = playbackOnFocusChange('background', snd != null, pausedByLifecycle.current);
        pausedByLifecycle.current = next.pausedByLifecycle;
        if (next.command === 'pause' && snd) {
          try {
            snd.pause();
          } catch {
            /* ignore */
          }
        }
      },
    );
  }, []);

  return { setMusic, stop, volume, setVolume, muted, setMuted };
}
