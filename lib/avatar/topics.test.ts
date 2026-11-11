import type Anthropic from '@anthropic-ai/sdk';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {classifyTopic} from './topics';

const usage = {input_tokens: 500, output_tokens: 20};

function fakeCreate(impl: (...args: unknown[]) => Promise<unknown>) {
  const create = vi.fn(impl);
  return {client: {messages: {create}} as unknown as Anthropic, create};
}
const reply = (json: string) => ({model: 'claude-haiku-5-5', usage, content: [{type: 'text', text: json}]});

afterEach(() => vi.useRealTimers());

describe('classifyTopic', () => {
  it('classifies a question', async () => {
    const {client, create} = fakeCreate(async () => reply('{"topic":"salary","lang":"es"}'));
    expect(await classifyTopic('¿Cuánto quieres ganar?', 'es', client)).toEqual({topic: 'salary', lang: 'es', costMicroUsd: expect.any(Number)});
    const [params, options] = create.mock.calls[0] as unknown as [Record<string, unknown> & {messages: unknown[]}, {signal: AbortSignal}];
    expect(params).toMatchObject({model: 'claude-haiku-5-5', max_tokens: 200, output_config: {effort: 'low', format: {type: 'json_schema'}}});
    expect(params.messages).toEqual([{role: 'user', content: '¿Cuánto quieres ganar?'}]);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('counts the cost of the response', async () => {
    const {client} = fakeCreate(async () => reply('{"topic":"stack","lang":"en"}'));
    // 500*0.1 + 20*0.5
    expect((await classifyTopic('Hi', 'en', client)).costMicroUsd).toBe(60);
  });

  it('falls back when the topic is unknown', async () => {
    const {client} = fakeCreate(async () => reply('{"topic":"weather","lang":"en"}'));
    expect(await classifyTopic('Hi', 'es', client)).toMatchObject({topic: 'unknown', lang: 'en'});
  });

  it('uses the page language when lang is malformed', async () => {
    const {client} = fakeCreate(async () => reply('{"topic":"stack","lang":"english"}'));
    expect(await classifyTopic('Hi', 'es', client)).toMatchObject({topic: 'stack', lang: 'es'});
  });

  it('still counts the cost when the reply cannot be parsed', async () => {
    const {client} = fakeCreate(async () => reply('not json'));
    const result = await classifyTopic('Hi', 'en', client);
    expect(result).toMatchObject({topic: 'unknown', lang: 'en'});
    expect(result.costMicroUsd).toBe(60);
  });

  it('falls back after the timeout', async () => {
    vi.useFakeTimers();
    const {client} = fakeCreate(() => new Promise(() => {}));
    const result = classifyTopic('Hi', 'en', client, 10);
    await vi.advanceTimersByTimeAsync(10);
    expect(await result).toEqual({topic: 'unknown', lang: 'en', costMicroUsd: 0});
    expect(vi.getTimerCount()).toBe(0);
  });

  it('falls back on an API error', async () => {
    const {client} = fakeCreate(async () => {
      throw new Error('500');
    });
    expect(await classifyTopic('Hi', 'es', client)).toEqual({topic: 'unknown', lang: 'es', costMicroUsd: 0});
  });
});
