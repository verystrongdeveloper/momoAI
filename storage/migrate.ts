/** 네이티브에는 예전 localStorage가 없다. */
export async function migrateLegacyStorage(): Promise<boolean> {
  return true;
}
