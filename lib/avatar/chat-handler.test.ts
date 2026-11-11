import {describe, expect, it, vi} from 'vitest';
import type {AvatarConfig} from './config';
import type {AnswerChunk} from './answer';
import {readMonthStats} from './budget';
import {handleChat, type ChatDeps} from './chat-handler';
import {PROMPT_VERSION} from './prompt';
import type {ChatEvent, ChatMessage} from './protocol';
import {readEvents} from './sse';
import {createFakeRedis} from './testing/fake-redis';
import type {Limiter} from './limits';
import {signTranscript, verifyTranscript} from './transcript';

const SECRET = 's'.repeat(32);
const IP = '203.0.113.7';
const SESSION = '3f2b8c1e-9d4a-4b6e-8a1c-5e7f0d2a9b34';
const QUESTION = 'What did you build at Acme?';
const ANSWER = 'Hola';
const NOW = new Date('2026-11-11T12:00:00Z');

const CONFIG: AvatarConfig = {
  anthropicApiKey: 'key',
  redisUrl: 'https://redis.test',
  redisToken: 'token',
  signingSecret: SECRET,
  enabled: true,
  budget: {softUsd: 45, hardUsd: 60, fixedUsd: 0},
  limits: {sessionQuestions: 20, sessionMinutes: 30, ipDaily: 40, ipPerMinute: 6, globalDaily: 500},
};

const USAGE = {input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 10, cache_read_input_tokens: 20};
const END: AnswerChunk = {type: 'end', stopReason: 'end_turn', model: 'claude-opus-5-5', costMicroUsd: 5000, usage: USAGE};

function fakeLimiter(max: number): Limiter {
  const counts = new Map<string, number>();
  return {
    async limit(identifier) {
      const count = (counts.get(identifier) ?? 0) + 1;
      counts.set(identifier, count);
      return {success: count <= max};
    },
  };
}

type Step = AnswerChunk | Error;

function answerOf(steps: Step[]): ChatDeps['answer'] {
  return async function* () {
    for (const step of steps) {
      if (step instanceof Error) throw step;
      yield step;
    }
  };
}

function setup(overrides: Partial<ChatDeps> = {}) {
  const redis = createFakeRedis({now: () => NOW.getTime()});
  const log = vi.fn();
  const classify = vi.fn(async () => ({topic: 'experience' as const, lang: 'en', costMicroUsd: 300}));
  const checkBot = vi.fn(async () => ({isBot: false}));
  const answer = vi.fn(answerOf([{type: 'text', text: 'Ho'}, {type: 'text', text: 'la'}, END]));
  const deps: ChatDeps = {
    config: CONFIG,
    redis,
    limiters: {ipPerMinute: fakeLimiter(1000), ipDaily: fakeLimiter(1000), globalDaily: fakeLimiter(1000)},
    checkBot,
    answer,
    classify,
    now: () => NOW,
    log,
    ...overrides,
  };
  return {deps, redis, log, classify, checkBot, answer};
}

type Body = {sessionId: string; locale: string; messages: ChatMessage[]; signature: string | null};

function body(overrides: Partial<Body> = {}): Body {
  return {sessionId: SESSION, locale: 'en', messages: [{role: 'user', text: QUESTION}], signature: null, ...overrides};
}

function post(payload: unknown, raw = false): Request {
  return new Request('http://localhost/api/avatar/chat', {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-real-ip': IP},
    body: raw ? (payload as string) : JSON.stringify(payload),
  });
}

async function events(response: Response): Promise<ChatEvent[]> {
  const out: ChatEvent[] = [];
  for await (const event of readEvents(response.body!)) out.push(event);
  return out;
}

describe('handleChat pre-stream errors', () => {
  const stats = async (redis: ReturnType<typeof createFakeRedis>) => readMonthStats(redis, NOW);

  it('runs the checks in order and stops at the first failure', async () => {
    // A bot never reaches limits, mode or Claude.
    const bot = setup({checkBot: vi.fn(async () => ({isBot: true}))});
    const ipDaily = vi.spyOn(bot.deps.limiters!.ipDaily, 'limit');
    expect((await handleChat(post(body()), bot.deps)).status).toBe(403);
    expect(ipDaily).not.toHaveBeenCalled();
    expect(bot.answer).not.toHaveBeenCalled();

    // Exhausted limits never reach the mode check or Claude.
    const limited = setup();
    limited.deps.limiters = {ipPerMinute: fakeLimiter(0), ipDaily: fakeLimiter(1000), globalDaily: fakeLimiter(1000)};
    const getSpy = vi.spyOn(limited.redis!, 'get');
    expect((await handleChat(post(body()), limited.deps)).status).toBe(429);
    expect(getSpy).not.toHaveBeenCalled();
    expect(limited.answer).not.toHaveBeenCalled();
    expect(limited.classify).not.toHaveBeenCalled();

    // An invalid body never reaches the bot check.
    const invalid = setup();
    expect((await handleChat(post('nope', true), invalid.deps)).status).toBe(400);
    expect(invalid.checkBot).not.toHaveBeenCalled();

    // A paused avatar reads no body and calls nothing.
    const paused = setup({config: null});
    expect((await handleChat(post(body()), paused.deps)).status).toBe(503);
    expect(paused.checkBot).not.toHaveBeenCalled();
  });

  it('does not call Claude or record spend when the mode is paused by the hard cap', async () => {
    const {deps, redis, answer, classify} = setup();
    await redis!.set('avatar:spend:2026-11', 61_000_000);
    const response = await handleChat(post(body()), deps);
    expect(response.status).toBe(503);
    expect(answer).not.toHaveBeenCalled();
    expect(classify).not.toHaveBeenCalled();
  });

  it.each([
    ['paused', 503, 'no config'],
    ['paused', 503, 'AVATAR_ENABLED=false'],
    ['invalid', 400, 'a body over 32 KB'],
    ['invalid', 400, 'malformed JSON'],
    ['bot', 403, 'a bot'],
    ['session_limit', 429, 'the 21st question'],
    ['rate_limited', 429, 'an exhausted IP'],
    ['paused', 503, 'Redis failing'],
    ['paused', 503, 'the hard cap reached'],
    ['signature', 409, 'a tampered history'],
    ['upstream', 502, 'Claude failing before the first chunk'],
  ])('returns %s (%i) for %s', async (code, status, scenario) => {
    const s = setup();
    let request = post(body());
    switch (scenario) {
      case 'no config':
        s.deps.config = null;
        break;
      case 'AVATAR_ENABLED=false':
        s.deps.config = {...CONFIG, enabled: false};
        break;
      case 'a body over 32 KB':
        request = post(body({messages: [{role: 'user', text: 'x'.repeat(40_000)}]}));
        break;
      case 'malformed JSON':
        request = post('{not json', true);
        break;
      case 'a bot':
        s.deps.checkBot = async () => ({isBot: true});
        break;
      case 'the 21st question': {
        const redis = createFakeRedis({now: () => NOW.getTime()});
        await redis.set(`avatar:session:${SESSION}`, 20, {ex: 1800});
        s.deps.redis = redis;
        break;
      }
      case 'an exhausted IP':
        s.deps.limiters = {ipPerMinute: fakeLimiter(0), ipDaily: fakeLimiter(10), globalDaily: fakeLimiter(10)};
        break;
      case 'Redis failing':
        s.deps.redis = createFakeRedis({failing: true});
        break;
      case 'the hard cap reached':
        await s.redis!.set('avatar:spend:2026-11', 61_000_000);
        break;
      case 'a tampered history': {
        const messages: ChatMessage[] = [
          {role: 'user', text: 'first'},
          {role: 'assistant', text: 'reply'},
          {role: 'user', text: 'second'},
        ];
        const signature = signTranscript(
          {sessionId: SESSION, messages: messages.slice(0, 2), promptVersion: PROMPT_VERSION},
          SECRET
        );
        messages[1] = {role: 'assistant', text: 'tampered'};
        await s.redis!.set(`avatar:session:${SESSION}`, 1, {ex: 1800});
        request = post(body({messages, signature}));
        break;
      }
      case 'Claude failing before the first chunk':
        s.deps.answer = answerOf([new Error('boom')]);
        break;
    }
    const response = await handleChat(request, s.deps);
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ok: false, code});
    if (code === 'upstream') {
      // No spend is recorded when Claude fails before answering.
      expect((await stats(s.redis!)).questions).toBe(0);
    }
  });
});

describe('handleChat stream', () => {
  it('streams delta events and a signed done', async () => {
    const {deps} = setup();
    const response = await handleChat(post(body()), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-cache, no-transform');

    const all = await events(response);
    expect(all).toHaveLength(3);
    expect(all[0]).toEqual({type: 'delta', text: 'Ho'});
    expect(all[1]).toEqual({type: 'delta', text: 'la'});
    const done = all[2];
    if (done.type !== 'done') throw new Error('expected done');
    expect(done).toMatchObject({topic: 'experience', lang: 'en', mode: 'full', remaining: 19});
    expect(
      verifyTranscript(
        {
          sessionId: SESSION,
          messages: [...body().messages, {role: 'assistant', text: ANSWER}],
          promptVersion: PROMPT_VERSION,
        },
        done.signature,
        SECRET
      )
    ).toBe(true);
  });

  it('starts the classifier with the last question and locale', async () => {
    const {deps, classify} = setup();
    await events(await handleChat(post(body({locale: 'es'})), deps));
    expect(classify).toHaveBeenCalledWith(QUESTION, 'es');
  });

  it('records the answer and classifier cost', async () => {
    const {deps, redis} = setup();
    await events(await handleChat(post(body()), deps));
    expect(await readMonthStats(redis!, NOW)).toEqual({spendMicroUsd: 5300, questions: 1, conversations: 1});
  });

  it('does not count a follow-up as a new conversation', async () => {
    const {deps, redis} = setup();
    const history: ChatMessage[] = [
      {role: 'user', text: 'first'},
      {role: 'assistant', text: 'reply'},
    ];
    const signature = signTranscript({sessionId: SESSION, messages: history, promptVersion: PROMPT_VERSION}, SECRET);
    await redis!.set(`avatar:session:${SESSION}`, 1, {ex: 1800});
    await events(await handleChat(post(body({messages: [...history, {role: 'user', text: 'second'}], signature})), deps));
    expect((await readMonthStats(redis!, NOW)).conversations).toBe(0);
  });

  it('sends a refusal error and no done', async () => {
    const {deps, redis} = setup({
      answer: answerOf([{type: 'text', text: 'No'}, {...END, stopReason: 'refusal'}]),
    });
    const all = await events(await handleChat(post(body()), deps));
    expect(all.at(-1)).toEqual({type: 'error', code: 'refusal'});
    expect(all.some((e) => e.type === 'done')).toBe(false);
    // The refused answer still cost money.
    expect((await readMonthStats(redis!, NOW)).spendMicroUsd).toBe(5300);
  });

  it('sends an upstream error when the answer breaks mid-stream', async () => {
    const {deps, redis} = setup({answer: answerOf([{type: 'text', text: 'Ho'}, new Error('cut')])});
    const all = await events(await handleChat(post(body()), deps));
    expect(all).toEqual([
      {type: 'delta', text: 'Ho'},
      {type: 'error', code: 'upstream'},
    ]);
    // Only the classifier cost is known.
    expect((await readMonthStats(redis!, NOW)).spendMicroUsd).toBe(300);
  });

  it('still sends done when recording the spend fails', async () => {
    const {deps, redis, log} = setup();
    vi.spyOn(redis!, 'incrby').mockRejectedValue(new Error('redis down'));
    const all = await events(await handleChat(post(body()), deps));
    expect(all.at(-1)?.type).toBe('done');
    expect(log).toHaveBeenCalledWith(expect.objectContaining({code: 'spend_record_failed'}));
  });

  it('logs one entry per request with usage and cost', async () => {
    const {deps, log} = setup();
    await events(await handleChat(post(body()), deps));
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith({
      code: 'ok',
      model: 'claude-opus-5-5',
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 20,
      cacheWriteTokens: 10,
      costMicroUsd: 5300,
    });
  });

  it('never logs the conversation text', async () => {
    const failing = setup();
    vi.spyOn(failing.redis!, 'incrby').mockRejectedValue(new Error(`leak ${QUESTION}`));
    const runs = [setup(), failing, setup({checkBot: async () => ({isBot: true})}), setup({config: null})];
    for (const run of runs) await (await handleChat(post(body()), run.deps)).text();
    for (const run of runs) {
      for (const [entry] of run.log.mock.calls) {
        const line = JSON.stringify(entry);
        for (const secret of [QUESTION, ANSWER, 'Ho', SESSION, IP]) expect(line).not.toContain(secret);
      }
    }
  });
});
