// Client-side Anthropic wrapper. For tonight's dev preview only — the API key
// is bundled with the app (read from app.json `extra`). For production, move
// these calls back into the Supabase Edge Function in supabase/functions/scan-spider.

import Constants from 'expo-constants';

export const CLAUDE_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

function getApiKey(): string {
  const k =
    (Constants.expoConfig?.extra?.anthropicApiKey as string | undefined) ??
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ??
    '';
  if (!k) {
    throw new Error(
      'Anthropic API key not configured. Set extra.anthropicApiKey in app.json.',
    );
  }
  return k;
}

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export async function callClaudeTool<T>(opts: {
  system: string;
  userText?: string;
  imageBase64?: string;
  tools: ToolDef[];
  toolChoice: { type: 'tool'; name: string };
  maxTokens?: number;
}): Promise<T> {
  const userContent: unknown[] = [];
  if (opts.imageBase64) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: opts.imageBase64,
      },
    });
  }
  if (opts.userText) {
    userContent.push({ type: 'text', text: opts.userText });
  }

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: 'user', content: userContent }],
      tools: opts.tools,
      tool_choice: opts.toolChoice,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text}`);
  }
  const body = await res.json();
  const block = (body.content as { type: string; input?: unknown }[]).find(
    (b) => b.type === 'tool_use',
  );
  if (!block || !block.input) {
    throw new Error('Claude did not return a tool_use block');
  }
  return block.input as T;
}
