import {describe, expect, it} from 'vitest';
import type {ChatEvent} from '@/lib/avatar/protocol';
import {
  buildRequest,
  canSend,
  initialSession,
  isStatusBody,
  sessionReducer,
  type NoticeCode,
  type SessionAction,
  type SessionState
} from './session-state';

const reduce = (state: SessionState, ...actions: SessionAction[]) =>
  actions.reduce(sessionReducer, state);
const send = (question: string, turnId = `t-${question}`): SessionAction => ({
  type: 'send',
  turnId,
  question
});
const delta = (text: string): SessionAction => ({type: 'delta', text});
const fail = (code: NoticeCode): SessionAction => ({type: 'fail', code});
const done = (
  overrides: Partial<Extract<ChatEvent, {type: 'done'}>> = {}
): SessionAction => ({
  type: 'done',
  event: {
    type: 'done',
    signature: 'sig-1',
    topic: 'experience',
    lang: 'en',
    mode: 'full',
    remaining: 19,
    ...overrides
  }
});

const idle = initialSession('s1');
const afterOneDone = reduce(idle, send('Q1'), delta('A1'), done());

describe('sessionReducer', () => {
  it('starts idle and empty', () =>
    expect(idle).toEqual({
      sessionId: 's1',
      history: [],
      signature: null,
      turns: [],
      status: 'idle',
      remaining: null,
      mode: 'full',
      notice: null
    }));

  it('adds a streaming turn on send', () => {
    const s = reduce(idle, send('  Q1  '));
    expect(s.status).toBe('streaming');
    expect(s.turns).toEqual([
      {
        id: 't-  Q1  ',
        question: 'Q1',
        answer: '',
        lang: null,
        status: 'streaming',
        error: null
      }
    ]);
  });

  it('ignores a second send while answering', () => {
    const s = reduce(idle, send('Q1'));
    expect(sessionReducer(s, send('Q2'))).toBe(s);
  });

  it('accumulates deltas on the last turn', () => {
    const s = reduce(idle, send('Q'), delta('Hel'), delta('lo'));
    expect(s.turns[0].answer).toBe('Hello');
  });

  it('blocks the composer when the last answer leaves no questions', () => {
    const s = reduce(idle, send('Q'), delta('A'), done({remaining: 0}));
    expect(s).toMatchObject({
      status: 'blocked',
      notice: 'session_limit',
      signature: 'sig-1',
      remaining: 0,
      history: [
        {role: 'user', text: 'Q'},
        {role: 'assistant', text: 'A'}
      ]
    });
    expect(canSend(s, false)).toBe(false);
  });

  it('stores the done event', () => {
    expect(afterOneDone).toMatchObject({
      history: [
        {role: 'user', text: 'Q1'},
        {role: 'assistant', text: 'A1'}
      ],
      signature: 'sig-1',
      remaining: 19,
      mode: 'full',
      status: 'idle'
    });
    expect(afterOneDone.turns[0]).toMatchObject({
      status: 'done',
      answer: 'A1',
      lang: 'en'
    });
  });

  it('keeps the answer exactly as streamed', () => {
    const s = reduce(idle, send('Q'), delta(' A '), done());
    expect(s.history[1].text).toBe(' A ');
  });

  it('keeps a failed answer out of the signed history', () => {
    const s = reduce(afterOneDone, send('Q2'), delta('par'), fail('upstream'));
    expect(s.history).toEqual(afterOneDone.history);
    expect(s.signature).toBe(afterOneDone.signature);
    expect(s.status).toBe('idle');
    expect(s.turns[1]).toMatchObject({status: 'error', error: 'upstream'});
    expect(buildRequest(s, 'Q3', 'es').messages).toEqual([
      ...afterOneDone.history,
      {role: 'user', text: 'Q3'}
    ]);
  });

  it.each(['upstream', 'refusal', 'rate_limited', 'invalid', 'bot'] as const)(
    'returns to idle after a %s failure',
    (code) => {
      const s = reduce(idle, send('Q'), fail(code));
      expect(s).toMatchObject({status: 'idle', notice: null, signature: null});
      expect(s.turns[0]).toMatchObject({status: 'error', error: code});
    }
  );

  it('treats a code without its own row like upstream', () => {
    const s = reduce(idle, send('Q'), fail('signature'));
    expect(s.status).toBe('idle');
    expect(s.turns[0]).toMatchObject({status: 'error', error: 'signature'});
  });

  it('blocks the conversation at the session limit', () => {
    const s = reduce(idle, send('Q'), fail('session_limit'));
    expect(s).toMatchObject({status: 'blocked', notice: 'session_limit'});
    expect(s.turns[0]).toMatchObject({status: 'error', error: 'session_limit'});
  });

  it('blocks and pauses when the service is paused', () => {
    expect(reduce(idle, send('Q'), fail('paused'))).toMatchObject({
      status: 'blocked',
      mode: 'paused',
      notice: 'paused'
    });
  });

  it('starts over after a signature mismatch', () => {
    const s = reduce(afterOneDone, send('Q2'), {
      type: 'reset',
      sessionId: 'new',
      notice: 'signature'
    });
    expect(s).toMatchObject({
      sessionId: 'new',
      history: [],
      turns: [],
      signature: null,
      status: 'idle',
      notice: 'signature'
    });
  });

  it('keeps the mode on reset and clears the notice by default', () => {
    const s = reduce(
      idle,
      {type: 'mode', mode: 'text-only'},
      {type: 'reset', sessionId: 'new'}
    );
    expect(s).toMatchObject({mode: 'text-only', notice: null});
  });

  it('stops sending while paused', () => {
    const s = reduce(idle, {type: 'mode', mode: 'paused'});
    expect(sessionReducer(s, send('Q'))).toBe(s);
  });

  it('ignores stale events when no turn is streaming', () => {
    expect(sessionReducer(idle, delta('x'))).toBe(idle);
    expect(sessionReducer(idle, done())).toBe(idle);
    expect(sessionReducer(idle, fail('upstream'))).toBe(idle);
    expect(sessionReducer(afterOneDone, delta('x'))).toBe(afterOneDone);
  });
});

describe('buildRequest', () => {
  it('sends the trimmed question after the signed history', () =>
    expect(buildRequest(afterOneDone, '  Q2 ', 'en')).toEqual({
      sessionId: 's1',
      locale: 'en',
      messages: [...afterOneDone.history, {role: 'user', text: 'Q2'}],
      signature: 'sig-1'
    }));
});

describe('canSend', () => {
  it('is true when idle', () => expect(canSend(idle, false)).toBe(true));
  it('is false while a request is in flight', () =>
    expect(canSend(idle, true)).toBe(false));
  it('is false while streaming', () =>
    expect(canSend(reduce(idle, send('Q')), false)).toBe(false));
  it('is false once blocked', () =>
    expect(
      canSend(reduce(idle, send('Q'), fail('session_limit')), false)
    ).toBe(false));
  it('is false while paused', () =>
    expect(canSend(reduce(idle, {type: 'mode', mode: 'paused'}), false)).toBe(
      false
    ));
});

describe('isStatusBody', () => {
  it.each([{}, {mode: 'x'}, null, 'full', {mode: 1}])('rejects %j', (v) =>
    expect(isStatusBody(v)).toBe(false)
  );
  it.each(['full', 'text-only', 'paused'])('accepts %s', (mode) =>
    expect(isStatusBody({mode})).toBe(true)
  );
});
