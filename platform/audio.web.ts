/** 브라우저가 자동 재생을 막으면 다음 클릭이나 키 입력에서 한 번 시작한다. */
export function listenForPlaybackUnlock(play: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const resume = () => {
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
    play();
  };
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
  return () => {
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
}

/** 웹은 탭을 바꿔도 재생을 건드리지 않는다. */
export function listenForPlaybackFocus(_onActive: () => void, _onBackground: () => void): () => void {
  return () => {};
}
