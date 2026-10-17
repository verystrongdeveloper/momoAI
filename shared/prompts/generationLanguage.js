const LANGUAGES = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Simplified Chinese' };

function normalizeGenerationLanguage(value) {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value) ? value : 'ko';
}

/** Shared by direct REST and Express; never translate the script's machine identifiers. */
function withGenerationLanguage(instruction, language, mode = 'chat') {
  const target = LANGUAGES[normalizeGenerationLanguage(language)];
  const rules = [
    `OUTPUT LANGUAGE: ${target}.`,
    `Write all new user-visible content in ${target}, even if the user's message, history, persona, instructions or examples are in another language.`,
    'Language selection overrides the language of examples, not the character personality, relationships, tone or required output format.',
    'Do not explain or announce the language choice. Do not output a bilingual translation.',
  ];
  if (mode === 'event') rules.push(
    `Write the story title, dialogue, narration, choice text and affiliations in ${target}.`,
    'Keep canonical speaker identifiers exactly as listed in the allowed cast, including their original Korean spelling. Do not translate or romanize speaker identifiers before the colon.',
    'Never translate script keywords or metadata keys: 타이틀, narration, selection, deleteEmotion, deleteAll, waitSecond, endEvent, bg, emotion, music, sound, expression, animation.',
    'Preserve all asset filenames, animation identifiers, delimiters, choice numbering, and command syntax exactly. Translate only human-readable text.',
  );
  if (mode === 'select') rules.push(
    `Write direction and reason in ${target}. Return only the requested JSON.`,
    'Preserve JSON keys and canonical character names exactly as listed in the available cast. Do not translate or romanize character identifiers.',
  );
  return `${instruction}\n\n[Generation language]\n${rules.join('\n')}`;
}

module.exports = { normalizeGenerationLanguage, withGenerationLanguage };
