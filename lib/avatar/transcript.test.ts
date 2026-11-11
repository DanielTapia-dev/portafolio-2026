import {describe, expect, it} from 'vitest';
import type {ChatMessage} from '@/lib/avatar/protocol';
import {parseChatRequest, signTranscript, verifyTranscript} from '@/lib/avatar/transcript';

const SECRET = 'x'.repeat(32);
const sig = 'f'.repeat(64);
const u: ChatMessage = {role: 'user', text: 'Hello'};
const a: ChatMessage = {role: 'assistant', text: 'Hi, how can I help?'};
const valid = {
  sessionId: '3f2b8c1e-9d4a-4b6e-8a1f-5c7d2e9b0a14',
  locale: 'es',
  messages: [{role: 'user', text: '¿Qué stack usas?'}],
  signature: null,
};

const alternating = (userCount: number): ChatMessage[] =>
  Array.from({length: userCount * 2 - 1}, (_, i) => (i % 2 === 0 ? u : a));

describe('parseChatRequest', () => {
  it('accepts a first question', () => {
    expect(parseChatRequest(valid)).toEqual({ok: true, request: valid});
  });

  it('accepts a follow-up with a signature', () => {
    const body = {...valid, messages: [u, a, u], signature: sig};
    expect(parseChatRequest(body)).toEqual({ok: true, request: body});
  });

  it('accepts 20 user messages', () => {
    const body = {...valid, messages: alternating(20), signature: sig};
    expect(parseChatRequest(body).ok).toBe(true);
  });

  it('drops unknown fields', () => {
    const result = parseChatRequest({
      ...valid,
      extra: 1,
      messages: [{role: 'user', text: 'Hi', id: 7}],
    });
    expect(result).toEqual({
      ok: true,
      request: {...valid, messages: [{role: 'user', text: 'Hi'}]},
    });
  });

  it.each([
    ['a non-object body', null],
    ['a non-v4 session id', {...valid, sessionId: 'abc'}],
    ['an unknown locale', {...valid, locale: 'fr'}],
    ['no messages', {...valid, messages: []}],
    ['a whitespace-only question', {...valid, messages: [{role: 'user', text: '   '}]}],
    ['a 501-character question', {...valid, messages: [{role: 'user', text: 'a'.repeat(501)}]}],
    ['an unknown role', {...valid, messages: [{role: 'system', text: 'hi'}]}],
    ['a non-string text', {...valid, messages: [{role: 'user', text: 5}]}],
    ['history that ends with the assistant', {...valid, messages: [u, a], signature: sig}],
    ['two user turns in a row', {...valid, messages: [u, u], signature: sig}],
    ['a signature on the first question', {...valid, signature: 'f'.repeat(64)}],
    ['a missing signature after the first question', {...valid, messages: [u, a, u], signature: null}],
    ['an empty assistant text', {...valid, messages: [u, {role: 'assistant', text: ''}, u], signature: sig}],
    [
      'an assistant text over 4000 characters',
      {...valid, messages: [u, {role: 'assistant', text: 'a'.repeat(4001)}, u], signature: sig},
    ],
    ['21 user messages', {...valid, messages: alternating(21), signature: sig}],
  ])('rejects %s', (_, body) => {
    expect(parseChatRequest(body)).toEqual({ok: false});
  });

  it('accepts a 500-character question padded with spaces', () => {
    const body = {...valid, messages: [{role: 'user', text: `  ${'a'.repeat(500)}  `}]};
    expect(parseChatRequest(body)).toEqual({ok: true, request: body});
  });
});

describe('transcript signature', () => {
  const input = {sessionId: valid.sessionId, messages: [u, a], promptVersion: 'v1'};

  it('produces 64 hex characters', () => {
    expect(signTranscript(input, SECRET)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('verifies its own signature', () => {
    expect(verifyTranscript(input, signTranscript(input, SECRET), SECRET)).toBe(true);
  });

  it('ignores extra message fields', () => {
    const extra = {...input, messages: [{...u, id: 1}, a] as ChatMessage[]};
    expect(signTranscript(extra, SECRET)).toBe(signTranscript(input, SECRET));
  });

  it.each([
    ['a changed message', {...input, messages: [u, {...a, text: 'Different'}]}, SECRET],
    ['another session id', {...input, sessionId: '00000000-0000-4000-8000-000000000000'}, SECRET],
    ['another prompt version', {...input, promptVersion: 'v2'}, SECRET],
    ['another secret', input, 'y'.repeat(32)],
  ])('rejects %s', (_, changed, secret) => {
    const signature = signTranscript(input, SECRET);
    expect(verifyTranscript(changed, signature, secret)).toBe(false);
  });

  it.each([
    ['of the wrong length', 'abc'],
    ['empty', ''],
    ['non-hex', 'z'.repeat(64)],
    ['uppercase', signTranscriptUpper()],
  ])('rejects a signature that is %s without throwing', (_, bad) => {
    expect(verifyTranscript(input, bad, SECRET)).toBe(false);
  });
});

function signTranscriptUpper(): string {
  return signTranscript(
    {sessionId: valid.sessionId, messages: [u, a], promptVersion: 'v1'},
    SECRET,
  ).toUpperCase();
}
