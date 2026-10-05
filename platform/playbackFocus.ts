export type FocusPhase = 'active' | 'background';
export type FocusCommand = 'pause' | 'resume' | 'none';

/** 같은 트랙을 다시 만들지 않고, 멈춰 둔 경우에만 이어서 재생한다. */
export function playbackOnFocusChange(
  phase: FocusPhase,
  hasSound: boolean,
  pausedByLifecycle: boolean,
): { pausedByLifecycle: boolean; command: FocusCommand } {
  if (phase === 'background') {
    if (!hasSound) return { pausedByLifecycle, command: 'none' };
    return { pausedByLifecycle: true, command: 'pause' };
  }
  if (!hasSound || !pausedByLifecycle) return { pausedByLifecycle: false, command: 'none' };
  return { pausedByLifecycle: false, command: 'resume' };
}
