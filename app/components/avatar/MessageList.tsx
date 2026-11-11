import {useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {splitLinks} from './chat-utils';
import type {Turn} from './session-state';

const linkClassName =
  'font-medium text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// The model's text is rendered as plain text; only the links splitLinks
// recognises become anchors, so nothing it writes can turn into markup.
function AnswerText({text}: {text: string}) {
  return splitLinks(text).map((part, index) => {
    if (part.type === 'text') return <span key={index}>{part.text}</span>;
    if (part.external) {
      return (
        <a
          key={index}
          href={part.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {part.label}
        </a>
      );
    }
    return (
      // The page locale picks the prefix, so /es/contact is mapped to /contact.
      <Link key={index} href="/contact" className={linkClassName}>
        {part.label}
      </Link>
    );
  });
}

type MessageListProps = {
  turns: Turn[];
  busy: boolean;
};

export default function MessageList({turns, busy}: MessageListProps) {
  const t = useTranslations('Ask');
  const containerRef = useRef<HTMLDivElement>(null);
  const lastAnswerLength = turns.at(-1)?.answer.length ?? 0;

  // Follow the answer as it streams in. Scrolling the container, not the
  // page, keeps the composer where it is.
  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [turns.length, lastAnswerLength]);

  return (
    <div
      ref={containerRef}
      aria-busy={busy}
      className="space-y-5 px-4 py-5 md:min-h-0 md:flex-1 md:overflow-y-auto md:px-6"
    >
      <div className="max-w-[85%] space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {t('avatarName')}
        </p>
        <p className="rounded-2xl rounded-tl-sm border border-border bg-background/60 px-4 py-3 text-foreground">
          {t('greeting')}
        </p>
      </div>

      {turns.map((turn) => {
        // Anthropic advises discarding partial output after a refusal.
        const answer = turn.error === 'refusal' ? '' : turn.answer;
        return (
        <div key={turn.id} className="space-y-5">
          <div className="ml-auto max-w-[85%] space-y-1 text-right">
            <p className="text-xs font-medium text-muted-foreground">
              {t('you')}
            </p>
            <p className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-left text-primary-foreground">
              {turn.question}
            </p>
          </div>

          {(answer || turn.status === 'streaming') && (
            <div className="max-w-[85%] space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('avatarName')}
              </p>
              {answer ? (
                <p
                  lang={turn.lang ?? undefined}
                  className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-border bg-background/60 px-4 py-3 text-foreground"
                >
                  <AnswerText text={answer} />
                </p>
              ) : (
                <p className="rounded-2xl rounded-tl-sm border border-border bg-background/60 px-4 py-3 text-muted-foreground animate-pulse motion-reduce:animate-none">
                  {t('thinking')}
                </p>
              )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
