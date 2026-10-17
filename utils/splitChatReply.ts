/** Western punctuation uses spaces; Japanese/Chinese sentences often do not. */
export function splitChatReply(text: string) {
  return text
    .split(/(?<=[.!?])\s+(?=\S)|(?<=[。！？])\s*(?=\S)/gu)
    .map(sentence => sentence.replace(/\n/g, ' ').trim())
    .filter(sentence => sentence !== '' && !/^(\.){2,}$/.test(sentence));
}
