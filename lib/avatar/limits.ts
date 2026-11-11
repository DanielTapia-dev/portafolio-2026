import {createHmac} from 'node:crypto';
import {Ratelimit} from '@upstash/ratelimit';
import type {Redis} from '@upstash/redis';
import type {AvatarLimits} from './config';
import type {AvatarRedis} from './redis';

export type Limiter = {limit(identifier: string): Promise<{success: boolean}>};
export type Limiters = {ipPerMinute: Limiter; ipDaily: Limiter; globalDaily: Limiter};
export type LimitOutcome = {ok: true; remaining: number} | {ok: false; code: 'session_limit' | 'rate_limited'};

// Distinct prefixes so the three windows can never share a key.
export function createLimiters(redis: Redis, limits: AvatarLimits): Limiters {
  const build = (prefix: string, max: number, window: '1 m' | '1 d') =>
    new Ratelimit({redis, limiter: Ratelimit.slidingWindow(max, window), prefix: `avatar:rl:${prefix}`, analytics: false});
  return {
    ipPerMinute: build('ip-minute', limits.ipPerMinute, '1 m'),
    ipDaily: build('ip-day', limits.ipDaily, '1 d'),
    globalDaily: build('global-day', limits.globalDaily, '1 d'),
  };
}

export function clientIp(headers: Headers): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

// Only the HMAC is stored, so Redis never holds a raw visitor IP.
export function hashIp(ip: string, secret: string): string {
  return `ip:${createHmac('sha256', secret).update(ip).digest('hex')}`;
}

// The session limit is soft (the browser creates the session id); the IP limit
// is the real brake. Redis errors propagate so the caller can fail closed.
export async function checkLimits(input: {
  redis: AvatarRedis;
  limiters: Limiters;
  limits: AvatarLimits;
  sessionId: string;
  isFirstQuestion: boolean;
  ipKey: string;
}): Promise<LimitOutcome> {
  const {redis, limiters, limits, sessionId, isFirstQuestion, ipKey} = input;
  const key = `avatar:session:${sessionId}`;

  if (isFirstQuestion) await redis.set(key, 0, {ex: limits.sessionMinutes * 60, nx: true});
  const n = await redis.incr(key);
  if (!isFirstQuestion && n === 1) {
    // The counter did not exist: the session expired or never started. Drop the
    // key the incr just created so it does not linger without a TTL.
    await redis.del(key);
    return {ok: false, code: 'session_limit'};
  }
  if (n > limits.sessionQuestions) return {ok: false, code: 'session_limit'};

  if (!(await limiters.ipPerMinute.limit(ipKey)).success) return {ok: false, code: 'rate_limited'};
  if (!(await limiters.ipDaily.limit(ipKey)).success) return {ok: false, code: 'rate_limited'};
  if (!(await limiters.globalDaily.limit('global')).success) return {ok: false, code: 'rate_limited'};

  return {ok: true, remaining: limits.sessionQuestions - n};
}
