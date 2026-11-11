'use client';

import {useCallback, useEffect, useReducer, useRef} from 'react';
import {
  CHAT_ENDPOINT,
  STATUS_ENDPOINT,
  type AvatarLocale,
  type ErrorBody,
  type StatusBody
} from '@/lib/avatar/protocol';
import {readEvents} from '@/lib/avatar/sse';
import {registerAnalyticsProperty, trackEvent} from '@/lib/analytics/events';
import {latencyBucket} from './chat-utils';
import {
  buildRequest,
  initialSession,
  sessionReducer,
  type NoticeCode
} from './session-state';

const LIMIT_CODES: readonly NoticeCode[] = [
  'session_limit',
  'rate_limited',
  'paused'
];

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as ErrorBody).ok === false &&
    typeof (value as ErrorBody).code === 'string'
  );
}

export function useAvatarSession(locale: AvatarLocale) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initialSession(crypto.randomUUID())
  );
  // Mirror of the latest state for send(), which must not depend on a render.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Set synchronously so two quick presses cannot start two requests before
  // the first dispatch has rendered.
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(STATUS_ENDPOINT, {signal: controller.signal})
      .then((response) => (response.ok ? response.json() : null))
      .then((body: StatusBody | null) => {
        if (body) dispatch({type: 'mode', mode: body.mode});
      })
      // Keep 'full': the chat endpoint has the final say on the mode.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    (question: string, placement: 'suggested' | 'typed') => {
      const current = stateRef.current;
      const text = question.trim();
      if (!text || busyRef.current || current.mode === 'paused') return;
      busyRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;

      if (current.history.length === 0) {
        trackEvent('avatar_conversation_started', {channel: 'text', placement});
        registerAnalyticsProperty('avatar_used');
      }
      const request = buildRequest(current, text, locale);
      dispatch({type: 'send', turnId: crypto.randomUUID(), question: text});

      const fail = (code: NoticeCode) => {
        if (controller.signal.aborted) return;
        if (code === 'signature') {
          // The history no longer verifies: start a fresh conversation.
          dispatch({
            type: 'reset',
            sessionId: crypto.randomUUID(),
            notice: 'signature'
          });
          return;
        }
        if (LIMIT_CODES.includes(code)) {
          trackEvent('avatar_limit_reached', {outcome: code});
        }
        dispatch({type: 'fail', code});
      };

      const run = async () => {
        const startedAt = performance.now();
        let firstDeltaAt: number | null = null;
        try {
          const response = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(request),
            signal: controller.signal
          });
          if (!response.ok) {
            const body: unknown = await response.json().catch(() => null);
            return fail(isErrorBody(body) ? body.code : 'upstream');
          }
          if (!response.body) return fail('upstream');

          for await (const event of readEvents(response.body)) {
            if (controller.signal.aborted) return;
            if (event.type === 'delta') {
              firstDeltaAt ??= performance.now();
              dispatch({type: 'delta', text: event.text});
            } else if (event.type === 'done') {
              trackEvent('avatar_question_asked', {
                topic: event.topic,
                channel: 'text',
                latency: latencyBucket(
                  (firstDeltaAt ?? performance.now()) - startedAt
                )
              });
              dispatch({type: 'done', event});
              return;
            } else {
              return fail(event.code);
            }
          }
          // The stream ended without done or error: the answer is partial.
          fail('upstream');
        } catch {
          fail('upstream');
        } finally {
          if (abortRef.current === controller) busyRef.current = false;
        }
      };
      void run();
    },
    [locale]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    busyRef.current = false;
    dispatch({type: 'reset', sessionId: crypto.randomUUID()});
  }, []);

  return {state, send, reset};
}
