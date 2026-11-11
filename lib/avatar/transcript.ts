// Server-only (node:crypto). It does not import 'server-only' because Vitest cannot resolve it.
import {createHmac, timingSafeEqual} from 'node:crypto';
import {
  AVATAR_LOCALES,
  CHAT_LIMITS,
  type AvatarLocale,
  type ChatMessage,
  type ChatRequest,
} from '@/lib/avatar/protocol';

export type ParseResult = {ok: true; request: ChatRequest} | {ok: false};

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNATURE = /^[0-9a-f]{64}$/;
const INVALID: ParseResult = {ok: false};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMessage(value: unknown, index: number): ChatMessage | null {
  if (!isRecord(value) || typeof value.text !== 'string') return null;
  // The roles must alternate starting with the user, so the role is implied by position.
  const expected = index % 2 === 0 ? 'user' : 'assistant';
  if (value.role !== expected) return null;

  const {text} = value;
  if (expected === 'user') {
    const length = text.trim().length;
    if (length < 1 || length > CHAT_LIMITS.userTextMax) return null;
  } else if (text.length < 1 || text.length > CHAT_LIMITS.assistantTextMax) {
    return null;
  }
  return {role: expected, text};
}

// Validates the parsed body only; the route checks the raw byte size before parsing.
export function parseChatRequest(body: unknown): ParseResult {
  if (!isRecord(body)) return INVALID;
  const {sessionId, locale, messages, signature} = body;

  if (typeof sessionId !== 'string' || !UUID_V4.test(sessionId)) return INVALID;
  if (!AVATAR_LOCALES.includes(locale as AvatarLocale)) return INVALID;
  if (!Array.isArray(messages) || messages.length === 0) return INVALID;
  // Alternating turns that start and end with the user have an odd length.
  if (messages.length % 2 === 0) return INVALID;
  if (messages.length > CHAT_LIMITS.maxUserMessages * 2 - 1) return INVALID;

  const parsed: ChatMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const message = parseMessage(messages[i], i);
    if (!message) return INVALID;
    parsed.push(message);
  }

  // Only the first question goes unsigned: later turns must carry the server's signature.
  if (parsed.length === 1) {
    if (signature !== null) return INVALID;
  } else if (typeof signature !== 'string' || !SIGNATURE.test(signature)) {
    return INVALID;
  }

  return {
    ok: true,
    request: {
      sessionId,
      locale: locale as AvatarLocale,
      messages: parsed,
      signature: signature as string | null,
    },
  };
}

export type TranscriptInput = {
  sessionId: string;
  messages: ChatMessage[];
  promptVersion: string;
};

export function signTranscript(input: TranscriptInput, secret: string): string {
  // Rebuild the messages so extra fields never affect the signature.
  const messages = input.messages.map(({role, text}) => ({role, text}));
  const payload = `transcript:${input.promptVersion}|${input.sessionId}|${JSON.stringify(messages)}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyTranscript(
  input: TranscriptInput,
  signature: string,
  secret: string,
): boolean {
  if (!SIGNATURE.test(signature)) return false;
  const expected = Buffer.from(signTranscript(input, secret), 'hex');
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
