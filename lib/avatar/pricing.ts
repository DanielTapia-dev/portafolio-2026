export type ModelPrice = {input: number; cacheWrite5m: number; cacheRead: number; output: number}; // USD per million tokens = micro-USD per token

// Verified against https://platform.claude.com/docs/en/about-claude/pricing
export const MODEL_PRICES: Record<string, ModelPrice> = {
  'claude-opus-5-5': {input: 4, cacheWrite5m: 5, cacheRead: 0.2, output: 20},
  'claude-sonnet-5-5': {input: 2, cacheWrite5m: 2.5, cacheRead: 0.1, output: 10},
  'claude-haiku-5-5': {input: 0.1, cacheWrite5m: 0.125, cacheRead: 0.01, output: 0.5},
  // Fallback models of the server-side fallback beta
  'claude-opus-5': {input: 5, cacheWrite5m: 6.25, cacheRead: 0.5, output: 25},
  'claude-opus-4-8': {input: 5, cacheWrite5m: 6.25, cacheRead: 0.5, output: 25},
};

// An unknown model must never be undercounted, so it takes the highest rate of each column.
const WORST_CASE: ModelPrice = {
  input: Math.max(...Object.values(MODEL_PRICES).map((p) => p.input)),
  cacheWrite5m: Math.max(...Object.values(MODEL_PRICES).map((p) => p.cacheWrite5m)),
  cacheRead: Math.max(...Object.values(MODEL_PRICES).map((p) => p.cacheRead)),
  output: Math.max(...Object.values(MODEL_PRICES).map((p) => p.output)),
};

export type UsageLike = {input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null};

export function usageCostMicroUsd(model: string, usage: UsageLike): number {
  const price = MODEL_PRICES[model] ?? WORST_CASE;
  const cost =
    usage.input_tokens * price.input +
    (usage.cache_creation_input_tokens ?? 0) * price.cacheWrite5m +
    (usage.cache_read_input_tokens ?? 0) * price.cacheRead +
    usage.output_tokens * price.output;
  // Round away float noise first so exact sums are not bumped up by 1.
  return Math.ceil(Math.round(cost * 1e6) / 1e6);
}

export function messageCostMicroUsd(message: {model: string; usage: UsageLike & {iterations?: (UsageLike & {model?: string | null})[] | null}}): number {
  const {iterations} = message.usage;
  if (!iterations?.length) return usageCostMicroUsd(message.model, message.usage);
  return iterations.reduce((sum, it) => sum + usageCostMicroUsd(it.model ?? message.model, it), 0);
}
