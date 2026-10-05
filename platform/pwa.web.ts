export function registerAppShell() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) return;
  void navigator.serviceWorker.register('/sw.js');
}
