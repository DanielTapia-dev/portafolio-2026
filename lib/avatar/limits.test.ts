import {describe, expect, it} from 'vitest';
import type {AvatarLimits} from './config';
import {createFakeRedis} from './testing/fake-redis';
import {Redis} from '@upstash/redis';
import {checkLimits, clientIp, createLimiters, hashIp, type Limiter, type Limiters} from './limits';

const SECRET = 'test-secret';
const LIMITS: AvatarLimits = {sessionQuestions: 20, sessionMinutes: 30, ipDaily: 40, ipPerMinute: 6, globalDaily: 500};

// Stand-in for the Lua-backed Ratelimit: one counter per identifier.
function fakeLimiter(max: number) {
  const counts = new Map<string, number>();
  let calls = 0;
  const limiter: Limiter = {
    async limit(identifier) {
      calls += 1;
      const count = (counts.get(identifier) ?? 0) + 1;
      counts.set(identifier, count);
      return {success: count <= max};
    },
  };
  return {limiter, calls: () => calls};
}

function setup(max: Partial<Record<keyof Limiters, number>> = {}) {
  let time = 1_000_000;
  const redis = createFakeRedis({now: () => time});
  const fakes = {
    ipPerMinute: fakeLimiter(max.ipPerMinute ?? 1000),
    ipDaily: fakeLimiter(max.ipDaily ?? 1000),
    globalDaily: fakeLimiter(max.globalDaily ?? 1000),
  };
  const limiters: Limiters = {
    ipPerMinute: fakes.ipPerMinute.limiter,
    ipDaily: fakes.ipDaily.limiter,
    globalDaily: fakes.globalDaily.limiter,
  };
  const input = {redis, limiters, limits: LIMITS, sessionId: 's1', isFirstQuestion: true, ipKey: 'ip:abc'};
  return {input, fakes, advance: (ms: number) => { time += ms; }};
}

describe('checkLimits', () => {
  it('allows 20 questions and stops the 21st', async () => {
    const {input} = setup();
    for (let i = 1; i <= 20; i++) {
      expect(await checkLimits({...input, isFirstQuestion: i === 1})).toEqual({ok: true, remaining: 20 - i});
    }
    expect(await checkLimits({...input, isFirstQuestion: false})).toEqual({ok: false, code: 'session_limit'});
  });

  it('ends a session after 30 minutes', async () => {
    const {input, advance} = setup();
    expect(await checkLimits(input)).toEqual({ok: true, remaining: 19});
    advance(30 * 60 * 1000 + 1000);
    expect(await checkLimits({...input, isFirstQuestion: false})).toEqual({ok: false, code: 'session_limit'});
  });

  it('rejects a signed question for an unknown session', async () => {
    const {input} = setup();
    expect(await checkLimits({...input, isFirstQuestion: false})).toEqual({ok: false, code: 'session_limit'});
  });

  it.each(['ipPerMinute', 'ipDaily', 'globalDaily'] as const)('returns rate_limited when %s is exhausted', async (name) => {
    const {input} = setup({[name]: 0});
    expect(await checkLimits(input)).toEqual({ok: false, code: 'rate_limited'});
  });

  it('stops at the first limiter that fails', async () => {
    const {input, fakes} = setup({ipPerMinute: 0});
    await checkLimits(input);
    expect(fakes.ipDaily.calls()).toBe(0);
    expect(fakes.globalDaily.calls()).toBe(0);
  });

  it('does not consume IP or global quota after a session limit', async () => {
    const {input, fakes} = setup();
    await checkLimits({...input, isFirstQuestion: false});
    expect(fakes.ipPerMinute.calls()).toBe(0);
    expect(fakes.ipDaily.calls()).toBe(0);
    expect(fakes.globalDaily.calls()).toBe(0);
  });
});

describe('hashIp', () => {
  it('builds limiters without the fail-open timeout', () => {
    const redis = new Redis({url: 'https://redis.test', token: 'token'});
    const limiters = createLimiters(redis, LIMITS) as unknown as Record<string, {timeout: number}>;
    // The library default (5 s) answers success: true when Redis is slow.
    for (const name of ['ipPerMinute', 'ipDaily', 'globalDaily']) expect(limiters[name].timeout).toBe(0);
  });

  it('hashes the IP', () => {
    expect(hashIp('203.0.113.7', SECRET)).toMatch(/^ip:[0-9a-f]{64}$/);
    expect(hashIp('203.0.113.7', SECRET)).not.toContain('203');
  });

  it('depends on the secret', () => {
    expect(hashIp('203.0.113.7', SECRET)).not.toBe(hashIp('203.0.113.7', 'other'));
  });
});

describe('clientIp', () => {
  it('reads the first x-forwarded-for entry', () => {
    expect(clientIp(new Headers({'x-forwarded-for': '203.0.113.7, 10.0.0.1'}))).toBe('203.0.113.7');
  });

  it('prefers x-real-ip', () => {
    expect(clientIp(new Headers({'x-real-ip': ' 198.51.100.2 ', 'x-forwarded-for': '203.0.113.7'}))).toBe('198.51.100.2');
  });

  it('falls back to unknown', () => {
    expect(clientIp(new Headers())).toBe('unknown');
    expect(clientIp(new Headers({'x-real-ip': '  '}))).toBe('unknown');
  });
});
