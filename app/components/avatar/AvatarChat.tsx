'use client';

import {useEffect} from 'react';
import {RotateCcw} from 'lucide-react';
import {initBotId} from 'botid/client/core';
import {useLocale, useTranslations} from 'next-intl';
import {CHAT_ENDPOINT, type AvatarLocale} from '@/lib/avatar/protocol';
import ContactActions from './ContactActions';
import Composer from './Composer';
import MessageList from './MessageList';
import SuggestedQuestions from './SuggestedQuestions';
import {useAvatarSession} from './useAvatarSession';
import type {NoticeCode} from './session-state';

// BotID is started here, not in instrumentation-client.ts, so it loads only
// on /ask. The flag keeps strict mode's double effect from running it twice.
let botIdStarted = false;

const KNOWN_NOTICES: readonly NoticeCode[] = [
  'invalid',
  'bot',
  'signature',
  'session_limit',
  'rate_limited',
  'paused',
  'upstream',
  'refusal'
];

export default function AvatarChat() {
  const t = useTranslations('Ask');
  const locale = useLocale() as AvatarLocale;
  const {state, send, reset} = useAvatarSession(locale);

  useEffect(() => {
    if (botIdStarted) return;
    botIdStarted = true;
    initBotId({protect: [{path: CHAT_ENDPOINT, method: 'POST'}]});
  }, []);

  const lastTurn = state.turns.at(-1);
  const paused = state.mode === 'paused';
  const busy = state.status === 'streaming';
  const blocked = state.status === 'blocked';
  const noticeCode: NoticeCode | null =
    (lastTurn?.status === 'error' ? lastTurn.error : null) ??
    state.notice ??
    (paused ? 'paused' : null);
  const noticeKey =
    noticeCode && KNOWN_NOTICES.includes(noticeCode) ? noticeCode : 'upstream';
  // Announced once, when the whole answer is in, not word by word.
  const announcement = lastTurn?.status === 'done' ? lastTurn.answer : '';

  return (
    <section className="flex h-[calc(100dvh-8rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <MessageList turns={state.turns} busy={busy} />

      <div className="space-y-4 px-4 pb-4 md:px-6">
        {state.turns.length === 0 && !paused && (
          <SuggestedQuestions onPick={(question) => send(question, 'suggested')} />
        )}

        {noticeCode && (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-border bg-background/60 p-4"
          >
            <p className="text-sm text-foreground">{t(`errors.${noticeKey}`)}</p>
            <ContactActions />
          </div>
        )}

        {(state.turns.length > 0 || blocked) && !paused && (
          <button
            type="button"
            onClick={reset}
            className={
              blocked
                ? 'inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                : 'inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            }
          >
            <RotateCcw size={14} aria-hidden="true" />
            {t('newConversation')}
          </button>
        )}
      </div>

      {!paused && (
        <Composer
          disabled={busy || blocked}
          remaining={state.remaining}
          onSend={(question) => send(question, 'typed')}
        />
      )}

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </section>
  );
}
