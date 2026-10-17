// Hermes does not consistently expose atob; decode bridge chunks without browser globals.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function decodeBase64(input: string): Uint8Array {
  if (input.length % 4 !== 0) throw new Error('VIDEO_ENCODE_FAILED');
  const padding = input.endsWith('==') ? 2 : input.endsWith('=') ? 1 : 0;
  const output = new Uint8Array(input.length / 4 * 3 - padding);
  let index = 0;
  for (let start = 0; start < input.length; start += 4) {
    const a = ALPHABET.indexOf(input[start]);
    const b = ALPHABET.indexOf(input[start + 1]);
    const c = input[start + 2] === '=' ? 0 : ALPHABET.indexOf(input[start + 2]);
    const d = input[start + 3] === '=' ? 0 : ALPHABET.indexOf(input[start + 3]);
    if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error('VIDEO_ENCODE_FAILED');
    const value = (a << 18) | (b << 12) | (c << 6) | d;
    if (index < output.length) output[index++] = (value >> 16) & 255;
    if (index < output.length) output[index++] = (value >> 8) & 255;
    if (index < output.length) output[index++] = value & 255;
  }
  return output;
}
