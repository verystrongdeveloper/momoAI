export const prompts: Record<string, string>;
export const resources: Record<string, { emotions?: string[] }>;
export function buildGroupSystemPrompt(members: string[]): string;
