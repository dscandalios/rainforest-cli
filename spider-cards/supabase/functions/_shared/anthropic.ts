// Thin Anthropic client for Edge Functions (Deno runtime).
// We avoid the official SDK to keep cold-start small.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: unknown;
}

export interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export async function callClaude(opts: {
  apiKey: string;
  system: string;
  messages: AnthropicMessage[];
  tools: AnthropicTool[];
  toolChoice: { type: 'tool'; name: string };
  maxTokens?: number;
}): Promise<AnthropicToolUseBlock> {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages,
      tools: opts.tools,
      tool_choice: opts.toolChoice,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }

  const body = await res.json();
  const block = (body.content as unknown[]).find(
    (b: any) => b.type === 'tool_use',
  ) as AnthropicToolUseBlock | undefined;
  if (!block) {
    throw new Error('Claude did not return a tool_use block');
  }
  return block;
}
