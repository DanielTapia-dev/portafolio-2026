import {getAnthropic, streamAnswer, type AnswerChunk} from './answer';
import {getMode, recordUsage} from './budget';
import type {AvatarConfig} from './config';
import {checkLimits, clientIp, createLimiters, hashIp, type Limiters} from './limits';
import {PROMPT_VERSION} from './prompt';
import {
  CHAT_LIMITS,
  ERROR_STATUS,
  type AvatarLocale,
  type ChatEvent,
  type ChatMessage,
  type PreStreamErrorCode,
} from './protocol';
import {getAvatarRedis, getUpstash, type AvatarRedis} from './redis';
import {encodeEvent} from './sse';
import {classifyTopic, type TopicResult} from './topics';
import {parseChatRequest, signTranscript, verifyTranscript} from './transcript';
import {readAvatarConfig} from './config';
import {checkBotId} from 'botid/server';

export type ChatDeps = {
  config: AvatarConfig | null;
  redis: AvatarRedis | null;
  limiters: Limiters | null;
  checkBot: () => Promise<{isBot: boolean}>;
  answer: (input: {
    messages: ChatMessage[];
    locale: AvatarLocale;
    signal?: AbortSignal;
  }) => AsyncGenerator<AnswerChunk>;
  classify: (question: string, fallbackLang: AvatarLocale) => Promise<TopicResult>;
  now: () => Date;
  log: (entry: Record<string, string | number | boolean | null>) => void;
};

type EndChunk = Extract<AnswerChunk, {type: 'end'}>;

// The log never receives conversation text, the session id or the IP: only a
// code, the model, token counts and cost.
function logEntry(code: string, end: EndChunk | null, costMicroUsd: number | null) {
  return {
    code,
    model: end?.model ?? null,
    inputTokens: end?.usage.input_tokens ?? null,
    outputTokens: end?.usage.output_tokens ?? null,
    cacheReadTokens: end?.usage.cache_read_input_tokens ?? null,
    cacheWriteTokens: end?.usage.cache_creation_input_tokens ?? null,
    costMicroUsd,
  };
}

export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  const {config, redis, limiters} = deps;
  const fail = (code: PreStreamErrorCode) => {
    deps.log(logEntry(code, null, null));
    return Response.json({ok: false, code}, {status: ERROR_STATUS[code]});
  };

  if (!config || !config.enabled || !redis || !limiters) return fail('paused');

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > CHAT_LIMITS.maxBodyBytes) return fail('invalid');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail('invalid');
  }
  const parsed = parseChatRequest(json);
  if (!parsed.ok) return fail('invalid');
  const {sessionId, locale, messages, signature} = parsed.request;

  // Fail closed: a BotID outage must not let unverified traffic through.
  try {
    if ((await deps.checkBot()).isBot) return fail('bot');
  } catch {
    deps.log(logEntry('bot_check_failed', null, null));
    return Response.json({ok: false, code: 'bot'}, {status: ERROR_STATUS.bot});
  }

  // Fail closed: if Redis cannot count, nothing reaches Claude.
  let limits;
  try {
    limits = await checkLimits({
      redis,
      limiters,
      limits: config.limits,
      sessionId,
      isFirstQuestion: signature === null,
      ipKey: hashIp(clientIp(request.headers), config.signingSecret),
    });
  } catch {
    return fail('paused');
  }
  if (!limits.ok) return fail(limits.code);

  const mode = await getMode(redis, config, deps.now());
  if (mode === 'paused') return fail('paused');

  if (
    signature !== null &&
    !verifyTranscript(
      {sessionId, messages: messages.slice(0, -1), promptVersion: PROMPT_VERSION},
      signature,
      config.signingSecret
    )
  ) {
    return fail('signature');
  }

  // classify never throws, so starting it unawaited cannot leave a rejection.
  const topic = deps.classify(messages[messages.length - 1].text, locale);
  // No abort signal on purpose: Anthropic bills what it already processed, so
  // generation runs to its end (bounded by max_tokens) and the full cost is
  // always recorded, even when the client has gone.
  const answer = deps.answer({messages, locale});
  let first: IteratorResult<AnswerChunk>;
  try {
    first = await answer.next();
  } catch {
    // The classifier already ran and was billed; a failed answer is not a
    // started conversation.
    const classified = await topic;
    if (classified.costMicroUsd > 0) {
      try {
        await recordUsage(
          redis,
          {costMicroUsd: classified.costMicroUsd, isNewConversation: false},
          deps.now()
        );
      } catch {
        deps.log(logEntry('spend_record_failed', null, classified.costMicroUsd));
      }
    }
    return fail('upstream');
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      // The client may leave mid-answer; the spend must still be recorded.
      const send = (event: ChatEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          open = false;
        }
      };

      let text = '';
      let end: EndChunk | null = null;
      let broke = false;
      try {
        for (let step = first; !step.done; step = await answer.next()) {
          const chunk = step.value;
          if (chunk.type === 'text') {
            text += chunk.text;
            send({type: 'delta', text: chunk.text});
          } else {
            end = chunk;
          }
        }
      } catch {
        broke = true;
      }

      const classified = await topic;
      let code = 'ok';
      if (broke || !end) {
        code = 'upstream';
        send({type: 'error', code: 'upstream'});
      } else if (
        // The next turn's parseChatRequest would reject such a transcript.
        text.trim().length === 0 ||
        text.length > CHAT_LIMITS.assistantTextMax
      ) {
        code = 'upstream';
        send({type: 'error', code: 'upstream'});
      } else if (end.stopReason === 'refusal') {
        code = 'refusal';
        send({type: 'error', code: 'refusal'});
      } else {
        const full: ChatMessage[] = [...messages, {role: 'assistant', text}];
        send({
          type: 'done',
          signature: signTranscript(
            {sessionId, messages: full, promptVersion: PROMPT_VERSION},
            config.signingSecret
          ),
          topic: classified.topic,
          lang: classified.lang,
          mode,
          remaining: limits.remaining,
        });
      }
      if (open) controller.close();

      const costMicroUsd = (end?.costMicroUsd ?? 0) + classified.costMicroUsd;
      try {
        await recordUsage(
          redis,
          {costMicroUsd, isNewConversation: signature === null},
          deps.now()
        );
      } catch {
        deps.log(logEntry('spend_record_failed', end, costMicroUsd));
      }
      // Logged last, so a log entry means the request is fully settled.
      deps.log(logEntry(code, end, costMicroUsd));
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

let limitersCache: {key: string; limiters: Limiters} | null = null;

export function defaultChatDeps(): ChatDeps {
  const config = readAvatarConfig();
  let limiters: Limiters | null = null;
  if (config) {
    // Built once per process, as the limiters keep their own sliding windows.
    const key = `${config.redisUrl}|${config.redisToken}`;
    if (limitersCache?.key !== key) {
      limitersCache = {key, limiters: createLimiters(getUpstash(config), config.limits)};
    }
    limiters = limitersCache.limiters;
  }
  return {
    config,
    redis: getAvatarRedis(config),
    limiters,
    checkBot: () => checkBotId(),
    // Never reached without config: handleChat returns paused first.
    answer: (input) => streamAnswer(input, getAnthropic(config!.anthropicApiKey)),
    classify: (question, lang) => classifyTopic(question, lang, getAnthropic(config!.anthropicApiKey)),
    now: () => new Date(),
    log: (entry) => console.info(JSON.stringify({scope: 'avatar', ...entry})),
  };
}
