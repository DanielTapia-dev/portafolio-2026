import type Anthropic from '@anthropic-ai/sdk';
import {usageCostMicroUsd} from './pricing';
import {TOPICS, type AvatarLocale, type Topic} from './protocol';

export const TOPIC_MODEL = 'claude-haiku-5-5';

export type TopicResult = {topic: Topic; lang: string; costMicroUsd: number};

const TOPIC_HINTS: Record<(typeof TOPICS)[number], string> = {
  experience: 'work history, roles, companies and years of experience',
  projects: 'specific projects, products or things he has built',
  stack: 'technologies, languages, frameworks and tools',
  leadership: 'leading or mentoring people and teams',
  certifications: 'certificates and professional credentials',
  education: 'degrees, university and courses',
  languages: 'spoken languages and language level',
  location_relocation: 'where he lives, relocation, time zones',
  work_style: 'how he works: remote, process, collaboration, soft skills',
  salary: 'salary expectations, rates or compensation',
  availability_visa: 'start date, notice period, work permits or visas',
  contact: 'how to contact or hire him',
  about_avatar: 'the avatar itself: what it is, how it works, who built it',
  off_topic: 'anything unrelated to his professional profile',
  other: 'professional questions that fit none of the topics above',
};

const SYSTEM = [
  "Classify a recruiter's question to a software developer's portfolio avatar by topic, and detect its language.",
  ...TOPICS.map((t) => `${t}: ${TOPIC_HINTS[t]}`),
  'Reply with JSON only.',
].join('\n');

const SCHEMA = {
  type: 'object',
  properties: {
    topic: {type: 'string', enum: [...TOPICS]},
    lang: {type: 'string', description: 'ISO 639-1 code of the question language'},
  },
  required: ['topic', 'lang'],
  additionalProperties: false,
};

export async function classifyTopic(
  question: string,
  fallbackLang: AvatarLocale,
  client: Anthropic,
  timeoutMs = 2000,
): Promise<TopicResult> {
  const fallback: TopicResult = {topic: 'unknown', lang: fallbackLang, costMicroUsd: 0};
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // The timer race does not rely on the client honouring the abort signal.
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('classifier timeout')), timeoutMs);
    });
    const request = client.messages.create(
      {
        model: TOPIC_MODEL,
        max_tokens: 200,
        output_config: {effort: 'low', format: {type: 'json_schema', schema: SCHEMA}},
        system: SYSTEM,
        messages: [{role: 'user', content: question}],
      },
      {signal: AbortSignal.timeout(timeoutMs)},
    );
    // A request that loses the race may reject later; keep that from surfacing.
    request.catch(() => {});
    const response = await Promise.race([request, timeout]);

    // The response was billed even if it cannot be read.
    const costMicroUsd = usageCostMicroUsd(response.model ?? TOPIC_MODEL, response.usage);
    try {
      const block = response.content.find((b) => b.type === 'text');
      const parsed: unknown = JSON.parse(block?.type === 'text' ? block.text : '');
      const {topic, lang} = (parsed ?? {}) as {topic?: unknown; lang?: unknown};
      return {
        topic: (TOPICS as readonly unknown[]).includes(topic) ? (topic as Topic) : 'unknown',
        lang: typeof lang === 'string' && /^[a-z]{2}$/.test(lang) ? lang : fallbackLang,
        costMicroUsd,
      };
    } catch {
      return {...fallback, costMicroUsd};
    }
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
