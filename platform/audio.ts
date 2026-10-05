import { AppState, AppStateStatus } from 'react-native';

/** 네이티브는 사용자 입력 없이 재생할 수 있다. */
export function listenForPlaybackUnlock(_play: () => void): () => void {
  return () => {};
}

/** 백그라운드·잠금·다른 앱에서는 잠시 멈추고, 돌아오면 같은 소리를 이어 재생한다. */
export function listenForPlaybackFocus(onActive: () => void, onBackground: () => void): () => void {
  const onChange = (state: AppStateStatus) => {
    if (state === 'active') onActive();
    else onBackground();
  };
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}
