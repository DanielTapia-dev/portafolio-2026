export type AvatarLimits = {sessionQuestions: number; sessionMinutes: number; ipDaily: number; ipPerMinute: number; globalDaily: number};

export type AvatarConfig = {
  anthropicApiKey: string; redisUrl: string; redisToken: string; signingSecret: string; enabled: boolean;
  budget: {softUsd: number; hardUsd: number; fixedUsd: number};
  limits: AvatarLimits;
};

// A bad override must never switch a safeguard off, so anything that is not a
// finite positive number falls back to the default.
function positive(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value.trim() !== '' && Number.isFinite(n) && n > 0 ? n : fallback;
}

// Returns null when a secret is missing: the avatar then stays paused instead
// of crashing the page.
export function readAvatarConfig(rawEnv: Record<string, string | undefined> = process.env): AvatarConfig | null {
  // A blank value copied from .env.example must count as unset, otherwise an
  // empty UPSTASH_* would win over the KV_* names the Marketplace creates.
  const env: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries(rawEnv)) {
    const trimmed = value?.trim();
    env[name] = trimmed === '' ? undefined : trimmed;
  }
  const anthropicApiKey = env.ANTHROPIC_API_KEY;
  const redisUrl = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  const signingSecret = env.AVATAR_SIGNING_SECRET;
  if (!anthropicApiKey || !redisUrl || !redisToken || !signingSecret || signingSecret.length < 32) return null;

  return {
    anthropicApiKey,
    redisUrl,
    redisToken,
    signingSecret,
    enabled: env.AVATAR_ENABLED === 'true',
    budget: {
      softUsd: positive(env.AVATAR_BUDGET_SOFT_USD, 45),
      hardUsd: positive(env.AVATAR_BUDGET_HARD_USD, 60),
      fixedUsd: positive(env.AVATAR_FIXED_MONTHLY_USD, 0),
    },
    limits: {
      sessionQuestions: positive(env.AVATAR_SESSION_QUESTIONS, 20),
      sessionMinutes: positive(env.AVATAR_SESSION_MINUTES, 30),
      ipDaily: positive(env.AVATAR_IP_DAILY, 40),
      ipPerMinute: positive(env.AVATAR_IP_PER_MINUTE, 6),
      globalDaily: positive(env.AVATAR_GLOBAL_DAILY, 500),
    },
  };
}
