import {describe, expect, it} from 'vitest';
import {readAvatarConfig} from './config';

const base = {
  ANTHROPIC_API_KEY: 'sk-test',
  UPSTASH_REDIS_REST_URL: 'https://redis.test',
  UPSTASH_REDIS_REST_TOKEN: 'token',
  AVATAR_SIGNING_SECRET: 'x'.repeat(32),
  AVATAR_ENABLED: 'true',
};

describe('readAvatarConfig', () => {
  it('needs every secret', () => expect(readAvatarConfig({ANTHROPIC_API_KEY: 'k'})).toBeNull());
  it('reads the Vercel KV names too', () => expect(readAvatarConfig({...base, UPSTASH_REDIS_REST_URL: undefined, KV_REST_API_URL: 'https://kv'})?.redisUrl).toBe('https://kv'));
  it('treats empty Upstash names as unset', () => expect(readAvatarConfig({...base, UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: ' ', KV_REST_API_URL: 'https://kv', KV_REST_API_TOKEN: 'kvtoken'})).toMatchObject({redisUrl: 'https://kv', redisToken: 'kvtoken'}));
  it('rejects a whitespace-only API key', () => expect(readAvatarConfig({...base, ANTHROPIC_API_KEY: '   '})).toBeNull());
  it('rejects a short signing secret', () => expect(readAvatarConfig({...base, AVATAR_SIGNING_SECRET: 'short'})).toBeNull());
  it('is off unless enabled', () => expect(readAvatarConfig({...base, AVATAR_ENABLED: undefined})?.enabled).toBe(false));
  it('is enabled only for the exact string true', () => expect(readAvatarConfig({...base, AVATAR_ENABLED: '1'})?.enabled).toBe(false));
  it('applies defaults', () => expect(readAvatarConfig(base)).toMatchObject({budget: {softUsd: 45, hardUsd: 60, fixedUsd: 0}, limits: {sessionQuestions: 20, sessionMinutes: 30, ipDaily: 40, ipPerMinute: 6, globalDaily: 500}}));
  it('ignores invalid overrides', () => expect(readAvatarConfig({...base, AVATAR_IP_DAILY: '-3'})?.limits.ipDaily).toBe(40));
  it('accepts valid overrides', () => expect(readAvatarConfig({...base, AVATAR_BUDGET_SOFT_USD: '10'})?.budget.softUsd).toBe(10));
  it('reads the fixed monthly cost', () => expect(readAvatarConfig({...base, AVATAR_FIXED_MONTHLY_USD: '22'})?.budget.fixedUsd).toBe(22));
});
