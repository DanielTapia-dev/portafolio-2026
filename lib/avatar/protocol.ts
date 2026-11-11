// Wire types shared by the chat route and the browser client.
// Keep this file free of server-only and Node-only imports.

export const AVATAR_LOCALES = ['en', 'es'] as const;
export type AvatarLocale = (typeof AVATAR_LOCALES)[number];

export type ChatMessage = {role: 'user' | 'assistant'; text: string};

export type ChatRequest = {
  sessionId: string;
  locale: AvatarLocale;
  messages: ChatMessage[];
  signature: string | null;
};

export type AvatarMode = 'full' | 'text-only' | 'paused';

export const TOPICS = [
  'experience',
  'projects',
  'stack',
  'leadership',
  'certifications',
  'education',
  'languages',
  'location_relocation',
  'work_style',
  'salary',
  'availability_visa',
  'contact',
  'about_avatar',
  'off_topic',
  'other',
] as const;
export type Topic = (typeof TOPICS)[number] | 'unknown';

export const CHAT_LIMITS = {
  maxBodyBytes: 32 * 1024,
  userTextMax: 500,
  assistantTextMax: 4000,
  maxUserMessages: 20,
} as const;

export type PreStreamErrorCode =
  | 'invalid'
  | 'bot'
  | 'signature'
  | 'session_limit'
  | 'rate_limited'
  | 'paused'
  | 'upstream';
export type StreamErrorCode = 'upstream' | 'refusal';

export const ERROR_STATUS: Record<PreStreamErrorCode, number> = {
  invalid: 400,
  bot: 403,
  signature: 409,
  session_limit: 429,
  rate_limited: 429,
  paused: 503,
  upstream: 502,
};

export type ChatEvent =
  | {type: 'delta'; text: string}
  | {
      type: 'done';
      signature: string;
      topic: Topic;
      lang: string;
      mode: AvatarMode;
      remaining: number;
    }
  | {type: 'error'; code: StreamErrorCode};

export type ErrorBody = {ok: false; code: PreStreamErrorCode};
export type StatusBody = {mode: AvatarMode};

export const CHAT_ENDPOINT = '/api/avatar/chat';
export const STATUS_ENDPOINT = '/api/avatar/status';
