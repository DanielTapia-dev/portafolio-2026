import type {AvatarMode} from './protocol';
import type {AvatarConfig} from './config';
import type {AvatarRedis} from './redis';

const TTL_SECONDS = 3_456_000; // 40 days, so a month's counters outlive the month

export function monthKey(now: Date): string {
  return now.toISOString().slice(0, 7);
}

const keys = (now: Date) => {
  const month = monthKey(now);
  return {spend: `avatar:spend:${month}`, questions: `avatar:questions:${month}`, conversations: `avatar:conversations:${month}`};
};

// Redis may hand numbers back as strings; missing or garbled counts as 0.
const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function modeFor(spendMicroUsd: number, budget: AvatarConfig['budget']): AvatarMode {
  const total = spendMicroUsd / 1e6 + budget.fixedUsd;
  if (total >= budget.hardUsd) return 'paused';
  if (total >= budget.softUsd) return 'text-only';
  return 'full';
}

// Any doubt (no config, disabled, Redis down) pauses the avatar rather than risk spend.
export async function getMode(redis: AvatarRedis | null, config: AvatarConfig | null, now: Date): Promise<AvatarMode> {
  if (!config || !redis || !config.enabled) return 'paused';
  try {
    return modeFor(toNumber(await redis.get(keys(now).spend)), config.budget);
  } catch {
    return 'paused';
  }
}

export async function recordUsage(redis: AvatarRedis, usage: {costMicroUsd: number; isNewConversation: boolean}, now: Date): Promise<void> {
  const k = keys(now);
  const touched = [k.spend, k.questions];
  await redis.incrby(k.spend, usage.costMicroUsd);
  await redis.incr(k.questions);
  if (usage.isNewConversation) {
    await redis.incr(k.conversations);
    touched.push(k.conversations);
  }
  await Promise.all(touched.map((key) => redis.expire(key, TTL_SECONDS)));
}

export type MonthStats = {spendMicroUsd: number; questions: number; conversations: number};

export async function readMonthStats(redis: AvatarRedis, now: Date): Promise<MonthStats> {
  const k = keys(now);
  const [spend, questions, conversations] = await redis.mget([k.spend, k.questions, k.conversations]);
  return {spendMicroUsd: toNumber(spend), questions: toNumber(questions), conversations: toNumber(conversations)};
}

export function averageCostMicroUsd(stats: MonthStats): number | null {
  return stats.conversations > 0 ? stats.spendMicroUsd / stats.conversations : null;
}
