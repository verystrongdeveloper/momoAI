import rooms from '../../shared/groupRooms.json';
import { buildGroupSystemPrompt, resources } from '../../shared/prompts';
import { buildEventPromptPro } from '../../shared/prompts/promptBuilderPro';
import { buildSelectionPrompt } from '../../shared/prompts/selectionPromptBuilder';
import { getGeminiKey } from '@/services/geminiKey';
import { dialogKey, sendWithFallback, userApiKey } from './rest';

type DialogPair = { user: string; ai: string };

const chatLogs = new Map<string, DialogPair[]>();

const TRIGGER_MESSAGE = `
당신은 블루 아카이브 세계관의 캐릭터입니다. 선생님에게 구체적인 이유로 말을 거세요. 뭔가 재밌는 일이 터질 것 같은 내용으로 걸면 됩니다. 어떤 재밌는 일이 터질지 다양하게 생각해 본 후 말을 걸어주세요. 무언가 반짝였다던가 이런 내용은 너무 진부하니 삼가세요. 제발 다양하게 생각해 본 후 그 리스트에서 하나만 딱 뽑아서 말을 거세요. 그리고 너무 길지 않게 말하도록 주의
    `;

const SELECTOR_SYSTEM = '너는 스토리 기획자다. 캐릭터처럼 말하지 않는다. 요청한 JSON만 출력한다. 대사·거절·설명 금지.';
const EVENT_WRITER_SYSTEM = '너는 블루 아카이브 인연 스토리 스크립트 작성기다. 캐릭터처럼 대답하지 말고, 요청한 출력 형식 그대로 스크립트만 작성한다.';

const groupRooms = Object.fromEntries(rooms.map((room) => [room.id, room.members]));

function readKey(): string {
  return userApiKey(getGeminiKey());
}

function pushLog(character: string, apiKey: string, pair: DialogPair): boolean {
  const slot = dialogKey(character, apiKey);
  const log = chatLogs.get(slot) ?? [];
  log.push(pair);
  if (log.length > 3) log.shift();
  chatLogs.set(slot, log);
  return log.length >= 3;
}

function makeGroupTurnPrompt(userMessage: string | null): string {
  if (!userMessage) {
    return '선생이 단톡방에 들어왔다. 멤버 2~4명이 먼저 떠들어라. 출력 형식을 지켜라.';
  }
  return `선생: "${userMessage}"\n위 말에 멤버들이 단톡방처럼 반응하라. 출력 형식을 지켜라.`;
}

function membersOf(roomId: string): string[] {
  const members = groupRooms[roomId];
  if (!members) throw new Error('roomId 누락 또는 방 없음');
  return members;
}

export const directClient = {
  async trigger(character: string) {
    const apiKey = readKey();
    if (!character) throw new Error('character 누락');
    const triggerLine = await sendWithFallback(character, '', TRIGGER_MESSAGE, undefined, apiKey);
    pushLog(character, apiKey, { user: '(트리거)', ai: triggerLine });
    return { triggerLine };
  },

  async chat(character: string, message: string) {
    const apiKey = readKey();
    if (!character || !message) throw new Error('character 또는 message 누락');
    const reply = await sendWithFallback(character, '', message, undefined, apiKey);
    const eventReady = pushLog(character, apiKey, { user: message, ai: reply });
    return { reply, eventReady };
  },

  async createEvent(character: string) {
    const apiKey = readKey();
    if (!character) throw new Error('character 누락');
    const dialogHistory = chatLogs.get(dialogKey(character, apiKey)) ?? [];
    if (dialogHistory.length !== 3) throw new Error('dialogHistory 부족(3쌍 필요)');

    const rawSelText = await sendWithFallback(character, 'select', buildSelectionPrompt(dialogHistory), SELECTOR_SYSTEM, apiKey);
    const jsonMatch = rawSelText.match(/\{[\s\S]*}/);
    let selection: { characters?: { name?: string }[]; direction?: string };
    if (!jsonMatch) {
      selection = {
        characters: [],
        direction: `최근 대화를 이어 '${character}' 중심의 인연 스토리를 진행한다.`,
      };
    } else {
      selection = JSON.parse(jsonMatch[0]);
    }

    const allCharsWithEmotions: { name: string; emotions: string[] }[] = [
      { name: character, emotions: resources[character]?.emotions ?? [] },
    ];
    for (const selectedChar of selection.characters ?? []) {
      if (selectedChar.name && selectedChar.name !== character) {
        allCharsWithEmotions.push({
          name: selectedChar.name,
          emotions: resources[selectedChar.name]?.emotions ?? [],
        });
      }
    }

    const eventPrompt = buildEventPromptPro(character, dialogHistory, allCharsWithEmotions, selection.direction ?? '');
    const script = (await sendWithFallback(character, 'event', eventPrompt, EVENT_WRITER_SYSTEM, apiKey)).trim();
    return { eventScript: script };
  },

  async groupTrigger(roomId: string) {
    const apiKey = readKey();
    const members = membersOf(roomId);
    const answer = await sendWithFallback(
      `groupChat_${roomId}`,
      '',
      makeGroupTurnPrompt(null),
      buildGroupSystemPrompt(members),
      apiKey,
    );
    return { answer };
  },

  async groupChat(roomId: string, userMessage: string) {
    const apiKey = readKey();
    if (!userMessage) throw new Error('입력 부족');
    const members = membersOf(roomId);
    const answer = await sendWithFallback(
      `groupChat_${roomId}`,
      '',
      makeGroupTurnPrompt(userMessage),
      buildGroupSystemPrompt(members),
      apiKey,
    );
    return { answer };
  },
};
