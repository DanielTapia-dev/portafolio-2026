import type {
  AvatarLocale,
  AvatarMode,
  ChatEvent,
  ChatMessage,
  ChatRequest,
  PreStreamErrorCode,
  StatusBody,
  StreamErrorCode
} from '@/lib/avatar/protocol';

export type NoticeCode = PreStreamErrorCode | StreamErrorCode;

export type Turn = {
  id: string;
  question: string;
  answer: string;
  lang: string | null;
  status: 'streaming' | 'done' | 'error';
  error: NoticeCode | null;
};

export type SessionState = {
  sessionId: string;
  // Only answers that finished and were signed by the server. A failed or
  // partial answer never enters it, or the next request would not verify.
  history: ChatMessage[];
  signature: string | null;
  turns: Turn[];
  status: 'idle' | 'streaming' | 'blocked';
  remaining: number | null;
  mode: AvatarMode;
  notice: NoticeCode | null;
};

export type SessionAction =
  | {type: 'send'; turnId: string; question: string}
  | {type: 'delta'; text: string}
  | {type: 'done'; event: Extract<ChatEvent, {type: 'done'}>}
  | {type: 'fail'; code: NoticeCode}
  | {type: 'mode'; mode: AvatarMode}
  | {type: 'reset'; sessionId: string; notice?: NoticeCode};

export function initialSession(sessionId: string): SessionState {
  return {
    sessionId,
    history: [],
    signature: null,
    turns: [],
    status: 'idle',
    remaining: null,
    mode: 'full',
    notice: null
  };
}

function updateLastTurn(state: SessionState, patch: Partial<Turn>) {
  const turns = state.turns.slice();
  turns[turns.length - 1] = {...turns[turns.length - 1], ...patch};
  return turns;
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  if (action.type === 'mode') return {...state, mode: action.mode};
  if (action.type === 'reset') {
    return {
      ...initialSession(action.sessionId),
      mode: state.mode,
      notice: action.notice ?? null
    };
  }
  if (action.type === 'send') {
    if (state.status !== 'idle' || state.mode === 'paused') return state;
    const turn: Turn = {
      id: action.turnId,
      // Trimmed like buildRequest, so history matches what the server signed.
      question: action.question.trim(),
      answer: '',
      lang: null,
      status: 'streaming',
      error: null
    };
    return {...state, turns: [...state.turns, turn], status: 'streaming'};
  }

  // delta, done and fail only make sense for the turn in flight. After a reset
  // a late event from the old stream must not touch the new conversation.
  const last = state.turns[state.turns.length - 1];
  if (!last || last.status !== 'streaming') return state;

  switch (action.type) {
    case 'delta':
      return {
        ...state,
        turns: updateLastTurn(state, {answer: last.answer + action.text})
      };
    case 'done':
      return {
        ...state,
        history: [
          ...state.history,
          {role: 'user', text: last.question},
          {role: 'assistant', text: last.answer}
        ],
        signature: action.event.signature,
        remaining: action.event.remaining,
        mode: action.event.mode,
        turns: updateLastTurn(state, {status: 'done', lang: action.event.lang}),
        status: 'idle'
      };
    case 'fail': {
      const turns = updateLastTurn(state, {
        status: 'error',
        error: action.code
      });
      if (action.code === 'session_limit') {
        return {...state, turns, status: 'blocked', notice: 'session_limit'};
      }
      if (action.code === 'paused') {
        return {
          ...state,
          turns,
          status: 'blocked',
          mode: 'paused',
          notice: 'paused'
        };
      }
      return {...state, turns, status: 'idle'};
    }
  }
}

export function buildRequest(
  state: SessionState,
  question: string,
  locale: AvatarLocale
): ChatRequest {
  return {
    sessionId: state.sessionId,
    locale,
    messages: [...state.history, {role: 'user', text: question.trim()}],
    signature: state.signature
  };
}

// A request may start only from idle: not while answering, not after the
// session limit or a pause, and not while another request is in flight.
export function canSend(state: SessionState, busy: boolean): boolean {
  return !busy && state.status === 'idle' && state.mode !== 'paused';
}

export function isStatusBody(value: unknown): value is StatusBody {
  if (typeof value !== 'object' || value === null) return false;
  const mode = (value as {mode?: unknown}).mode;
  return mode === 'full' || mode === 'text-only' || mode === 'paused';
}
