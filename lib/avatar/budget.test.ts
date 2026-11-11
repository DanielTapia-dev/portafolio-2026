import {describe, expect, it} from 'vitest';
import type {AvatarConfig} from './config';
import {averageCostMicroUsd, getMode, modeFor, monthKey, readMonthStats, recordUsage} from './budget';
import {createFakeRedis} from './testing/fake-redis';

const now = new Date('2026-11-11T12:00:00Z');
const config: AvatarConfig = {
  anthropicApiKey: 'k', redisUrl: 'https://redis.test', redisToken: 't', signingSecret: 'x'.repeat(32), enabled: true,
  budget: {softUsd: 45, hardUsd: 60, fixedUsd: 0},
  limits: {sessionQuestions: 20, sessionMinutes: 30, ipDaily: 40, ipPerMinute: 6, globalDaily: 500},
};

describe('budget', () => {
  it('uses the UTC month', () => expect(monthKey(new Date('2026-11-30T22:00:00-05:00'))).toBe('2026-12'));
  it.each([[44_999_999, 'full'], [45_000_000, 'text-only'], [60_000_000, 'paused']])('spend %i is %s', (spend, mode) => expect(modeFor(spend, {softUsd: 45, hardUsd: 60, fixedUsd: 0})).toBe(mode));
  it('counts fixed subscriptions', () => expect(modeFor(0, {softUsd: 45, hardUsd: 60, fixedUsd: 60})).toBe('paused'));
  it('pauses when Redis fails', async () => expect(await getMode(createFakeRedis({failing: true}), config, now)).toBe('paused'));
  it('pauses when disabled', async () => expect(await getMode(createFakeRedis(), {...config, enabled: false}, now)).toBe('paused'));
  it('pauses without Redis or config', async () => {
    expect(await getMode(null, config, now)).toBe('paused');
    expect(await getMode(createFakeRedis(), null, now)).toBe('paused');
  });
  it('is full with no spend and text-only past the soft cap', async () => {
    const redis = createFakeRedis();
    expect(await getMode(redis, config, now)).toBe('full');
    await redis.set('avatar:spend:2026-11', '45000000');
    expect(await getMode(redis, config, now)).toBe('text-only');
  });
  it('records spend, questions and new conversations', async () => {
    const redis = createFakeRedis();
    await recordUsage(redis, {costMicroUsd: 83200, isNewConversation: true}, now);
    await recordUsage(redis, {costMicroUsd: 11200, isNewConversation: false}, now);
    expect(await readMonthStats(redis, now)).toEqual({spendMicroUsd: 94400, questions: 2, conversations: 1});
  });
  it('expires the counters after 40 days', async () => {
    let t = now.getTime();
    const redis = createFakeRedis({now: () => t});
    await recordUsage(redis, {costMicroUsd: 1, isNewConversation: true}, now);
    t += 3_456_000 * 1000;
    expect(await readMonthStats(redis, now)).toEqual({spendMicroUsd: 0, questions: 0, conversations: 0});
  });
  it('averages the cost per conversation', () => expect(averageCostMicroUsd({spendMicroUsd: 300, questions: 6, conversations: 2})).toBe(150));
  it('has no average without conversations', () => expect(averageCostMicroUsd({spendMicroUsd: 0, questions: 0, conversations: 0})).toBeNull());
});
