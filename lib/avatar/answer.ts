import Anthropic from '@anthropic-ai/sdk';
import {messageCostMicroUsd, type UsageLike} from './pricing';
import {SYSTEM_PROMPT, toClaudeMessages} from './prompt';
import type {AvatarLocale, ChatMessage} from './protocol';

export const ANSWER_MODEL = 'claude-opus-5-5';

let cached: {apiKey: string; client: Anthropic} | undefined;

// One client per process, so connections are reused across requests.
export function getAnthropic(apiKey: string): Anthropic {
  if (cached?.apiKey !== apiKey) {
    cached = {apiKey, client: new Anthropic({apiKey, timeout: 30_000, maxRetries: 1})};
  }
  return cached.client;
}

export type AnswerChunk =
  | {type: 'text'; text: string}
  | {type: 'end'; stopReason: string | null; model: string; costMicroUsd: number; usage: UsageLike};

export async function* streamAnswer(
  input: {messages: ChatMessage[]; locale: AvatarLocale; signal?: AbortSignal},
  client: Anthropic,
): AsyncGenerator<AnswerChunk> {
  // No `thinking` key: Opus 5.5 rejects disabled/budgets, and omitting it means adaptive.
  const stream = client.beta.messages.stream(
    {
      model: ANSWER_MODEL,
      max_tokens: 2000,
      output_config: {effort: 'low'},
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      cache_control: {type: 'ephemeral'},
      system: [{type: 'text', text: SYSTEM_PROMPT, cache_control: {type: 'ephemeral'}}],
      messages: toClaudeMessages(input.messages, input.locale),
    },
    {signal: input.signal},
  );

  for await (const event of stream) {
    // Thinking deltas and fallback blocks are not part of the answer.
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield {type: 'text', text: event.delta.text};
    }
  }

  const message = await stream.finalMessage();
  yield {
    type: 'end',
    stopReason: message.stop_reason,
    model: message.model,
    // Counts every iteration, so a fallback run is billed at each model's rate.
    costMicroUsd: messageCostMicroUsd(message),
    usage: message.usage,
  };
}
