// Manual eval of the avatar (spec §15.4). It calls the real API and costs money:
// run it with `npm run eval:avatar` only after Daniel approves.
import {mkdirSync, writeFileSync} from 'node:fs';
import type Anthropic from '@anthropic-ai/sdk';
import {checkRules} from '../evals/avatar/rules';
import questions from '../evals/avatar/questions.json';
import {ANSWER_MODEL, getAnthropic, streamAnswer} from '@/lib/avatar/answer';
import {messageCostMicroUsd, type UsageLike} from '@/lib/avatar/pricing';
import {SYSTEM_PROMPT} from '@/lib/avatar/prompt';
import type {ChatMessage} from '@/lib/avatar/protocol';

type Question = (typeof questions)[number];
type Usage = UsageLike;
type Verdict = {pass: boolean; reasons: string; unsupported_claims: string[]};
type Judged = {verdict: Verdict | null; error: string | null; costMicroUsd: number};
type Run = {
  answer: string;
  ttftMs: number | null;
  totalMs: number;
  usage: Usage | null;
  costMicroUsd: number;
};

const FOLLOW_UP_INDEX = 6;
const RUBRIC =
  'Pass if the answer does what `expect` says, speaks in the first person, stays within about 90 words and ends with a next step. List in unsupported_claims every claim that is not in the profile; a faithful translation counts as supported.';
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    pass: {type: 'boolean'},
    reasons: {type: 'string'},
    unsupported_claims: {type: 'array', items: {type: 'string'}}
  },
  required: ['pass', 'reasons', 'unsupported_claims'],
  additionalProperties: false
};

async function runConversation(
  messages: ChatMessage[],
  lang: 'en' | 'es',
  client: Anthropic
): Promise<Run> {
  const start = performance.now();
  const run: Run = {answer: '', ttftMs: null, totalMs: 0, usage: null, costMicroUsd: 0};
  for await (const chunk of streamAnswer({messages, locale: lang}, client)) {
    if (chunk.type === 'text') {
      run.ttftMs ??= performance.now() - start;
      run.answer += chunk.text;
    } else {
      run.totalMs = performance.now() - start;
      run.usage = chunk.usage;
      run.costMicroUsd = chunk.costMicroUsd;
    }
  }
  return run;
}

// A refusal or a malformed verdict is recorded for that question instead of aborting the run.
async function judge(q: Question, answer: string, client: Anthropic): Promise<Judged> {
  try {
    const message = await client.messages.create({
      model: ANSWER_MODEL,
      max_tokens: 4000,
      output_config: {effort: 'medium', format: {type: 'json_schema', schema: VERDICT_SCHEMA}},
      system: `You grade answers of an AI avatar. This is the profile it must stay within:\n\n${SYSTEM_PROMPT}`,
      messages: [
        {
          role: 'user',
          content: `Question: ${q.question}\nExpect: ${q.expect}\nAnswer: ${answer}\n\nRubric: ${RUBRIC}`
        }
      ]
    });
    const costMicroUsd = messageCostMicroUsd(message);
    if (message.stop_reason !== 'end_turn') {
      return {verdict: null, error: `stop_reason ${message.stop_reason}`, costMicroUsd};
    }
    const block = message.content.find((b) => b.type === 'text');
    if (!block) return {verdict: null, error: 'no text block', costMicroUsd};
    return {verdict: JSON.parse(block.text) as Verdict, error: null, costMicroUsd};
  } catch (error) {
    return {verdict: null, error: error instanceof Error ? error.message : String(error), costMicroUsd: 0};
  }
}

// Nearest-rank percentile.
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)] ?? NaN;
}

const usd = (micro: number) => `$${(micro / 1e6).toFixed(4)}`;

async function main(): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set. Add it to .env.local before running the eval.');
    return 2;
  }
  const client = getAnthropic(apiKey);

  const prefix = await client.messages.countTokens({
    model: ANSWER_MODEL,
    system: SYSTEM_PROMPT,
    messages: [{role: 'user', content: 'Hi'}]
  });

  const rows = [];
  for (const q of questions) {
    console.log(`Question ${q.id}/${questions.length}...`);
    const run = await runConversation([{role: 'user', text: q.question}], q.lang as 'en' | 'es', client);
    const broken = checkRules(run.answer, q.lang as 'en' | 'es', {salary: q.salaryRule});
    rows.push({q, run, broken, judged: await judge(q, run.answer, client)});
  }

  const q6 = rows.find((r) => r.q.id === FOLLOW_UP_INDEX)!;
  const followUp = await runConversation(
    [
      {role: 'user', text: q6.q.question},
      {role: 'assistant', text: q6.run.answer},
      {role: 'user', text: 'And before that?'}
    ],
    'en',
    client
  );
  const cacheRead = followUp.usage?.cache_read_input_tokens ?? 0;

  console.table(
    rows.map(({q, run, broken, judged}) => ({
      id: q.id,
      lang: q.lang,
      rules: broken.length === 0 ? 'ok' : broken.join(','),
      judge: judged.verdict ? judged.verdict.pass : `error: ${judged.error}`,
      unsupported: judged.verdict?.unsupported_claims.length ?? '-',
      ttftMs: Math.round(run.ttftMs ?? NaN),
      cost: usd(run.costMicroUsd)
    }))
  );

  const rulesOk = rows.filter((r) => r.broken.length === 0).length;
  const supported = rows.filter((r) => r.judged.verdict?.unsupported_claims.length === 0).length;
  const quality = rows.filter((r) => r.judged.verdict?.pass).length;
  const ttfts = rows.map((r) => r.run.ttftMs ?? Infinity);
  const median = percentile(ttfts, 50);
  const p90 = percentile(ttfts, 90);
  const others = rows.slice(1).map((r) => r.run.costMicroUsd);
  const conversation6 = rows[0].run.costMicroUsd + 5 * percentile(others, 50);
  const total =
    rows.reduce((sum, r) => sum + r.run.costMicroUsd + r.judged.costMicroUsd, 0) +
    followUp.costMicroUsd;

  console.log(`Fixed rules: ${rulesOk}/${rows.length}`);
  console.log(`No unsupported claims: ${supported}/${rows.length}`);
  console.log(`Quality: ${quality}/${rows.length}`);
  console.log(`Time to first text: median ${Math.round(median)} ms, p90 ${Math.round(p90)} ms`);
  console.log(`Cost per question: ${rows.map((r) => usd(r.run.costMicroUsd)).join(' ')}`);
  console.log(`Estimated 6-question conversation: ${usd(conversation6)}`);
  console.log(`Prefix tokens: ${prefix.input_tokens}`);
  console.log(`Follow-up cache_read_input_tokens: ${cacheRead}`);
  console.log(`Run cost (answers, follow-up and judge): ${usd(total)}`);

  mkdirSync('evals/avatar/results', {recursive: true});
  const file = `evals/avatar/results/${new Date().toISOString().replaceAll(':', '-')}.json`;
  const results = rows.map(({q, run, broken, judged}) => ({...q, ...run, broken, judge: judged}));
  const summary = {rulesOk, supported, quality, median, p90, conversation6, total};
  writeFileSync(
    file,
    JSON.stringify({prefixTokens: prefix.input_tokens, results, followUp: {...followUp, cacheRead}, summary}, null, 2)
  );
  console.log(`Saved ${file}`);

  const passed =
    rulesOk === rows.length && supported === rows.length && quality >= 14 && p90 < 2000 && cacheRead > 0;
  console.log(passed ? 'PASS' : 'FAIL');
  return passed ? 0 : 1;
}

main().then((code) => process.exit(code));
