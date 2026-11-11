import type Anthropic from '@anthropic-ai/sdk';
import {describe, expect, it, vi} from 'vitest';
import {getAnthropic, streamAnswer, type AnswerChunk} from './answer';

type Ev = Record<string, unknown>;

function fakeClient(events: Ev[], message: Record<string, unknown>) {
  const stream = vi.fn(() => ({
    async *[Symbol.asyncIterator]() {
      for (const e of events) yield e;
    },
    finalMessage: async () => message,
  }));
  return {client: {beta: {messages: {stream}}} as unknown as Anthropic, stream};
}

async function collect(gen: AsyncGenerator<AnswerChunk>) {
  const out: AnswerChunk[] = [];
  for await (const c of gen) out.push(c);
  return out;
}

const usage = {input_tokens: 1000, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, iterations: null};
const text = (t: string) => ({type: 'content_block_delta', index: 0, delta: {type: 'text_delta', text: t}});

describe('streamAnswer', () => {
  it('sends the agreed request', async () => {
    const {client, stream} = fakeClient([], {stop_reason: 'end_turn', model: 'claude-sonnet-5-5', usage});
    const signal = new AbortController().signal;
    await collect(streamAnswer({messages: [{role: 'user', text: 'Hi'}], locale: 'en', signal}, client));
    const [params, options] = stream.mock.calls[0] as unknown as [Record<string, unknown> & {system: {cache_control: unknown}[]; messages: unknown[]}, {signal?: AbortSignal}];
    expect(params).toMatchObject({
      model: 'claude-sonnet-5-5',
      max_tokens: 2000,
      output_config: {effort: 'low'},
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      cache_control: {type: 'ephemeral'},
    });
    expect(params.system[0].cache_control).toEqual({type: 'ephemeral'});
    expect(params.messages).toHaveLength(1);
    expect(params).not.toHaveProperty('thinking');
    expect(options.signal).toBe(signal);
  });

  it('streams only the answer text', async () => {
    const events = [
      {type: 'content_block_delta', index: 0, delta: {type: 'thinking_delta', thinking: 'hmm'}},
      text('Ho'),
      {type: 'content_block_start', index: 1, content_block: {type: 'fallback'}},
      text('la'),
    ];
    const {client} = fakeClient(events, {stop_reason: 'end_turn', model: 'claude-sonnet-5-5', usage});
    const chunks = await collect(streamAnswer({messages: [{role: 'user', text: 'Hi'}], locale: 'es'}, client));
    expect(chunks).toEqual([
      {type: 'text', text: 'Ho'},
      {type: 'text', text: 'la'},
      {type: 'end', stopReason: 'end_turn', model: 'claude-sonnet-5-5', costMicroUsd: 3000, usage},
    ]);
  });

  it('reports a refusal and its cost', async () => {
    const {client} = fakeClient([], {stop_reason: 'refusal', model: 'claude-sonnet-5-5', usage});
    const chunks = await collect(streamAnswer({messages: [{role: 'user', text: 'Hi'}], locale: 'en'}, client));
    const end = chunks.at(-1);
    expect(end).toMatchObject({type: 'end', stopReason: 'refusal'});
    expect(end?.type === 'end' && end.costMicroUsd).toBeGreaterThan(0);
  });

  it('prices every iteration when a fallback ran', async () => {
    const iterations = [
      {model: 'claude-sonnet-5-5', input_tokens: 1000, output_tokens: 0},
      {model: 'claude-opus-5', input_tokens: 1000, output_tokens: 100},
    ];
    const {client} = fakeClient([], {stop_reason: 'end_turn', model: 'claude-opus-5', usage: {...usage, iterations}});
    const chunks = await collect(streamAnswer({messages: [{role: 'user', text: 'Hi'}], locale: 'en'}, client));
    // 1000*2 + (1000*5 + 100*25)
    expect(chunks.at(-1)).toMatchObject({costMicroUsd: 9500});
  });

  it('lets SDK errors propagate', async () => {
    const client = {beta: {messages: {stream: () => ({[Symbol.asyncIterator]: () => ({next: () => Promise.reject(new Error('boom'))}), finalMessage: async () => ({})})}}} as unknown as Anthropic;
    await expect(collect(streamAnswer({messages: [{role: 'user', text: 'Hi'}], locale: 'en'}, client))).rejects.toThrow('boom');
  });
});

describe('getAnthropic', () => {
  it('memoises one instance per key', () => {
    expect(getAnthropic('k1')).toBe(getAnthropic('k1'));
    expect(getAnthropic('k2')).not.toBe(getAnthropic('k1'));
  });
});
