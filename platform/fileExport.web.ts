import { chooseFileSaveTarget } from './fileSave.web';

export async function exportTextFile(filename: string, contents: string): Promise<void> {
  const target = await chooseFileSaveTarget(filename, 'text/plain', 'txt');
  if (target) await target.save(new TextEncoder().encode(contents).buffer);
}
