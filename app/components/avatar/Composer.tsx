import {useState, type RefObject} from 'react';
import {Send} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {CHAT_LIMITS} from '@/lib/avatar/protocol';

// The counter and the remaining-questions notice only appear when they matter.
const COUNTER_FROM = 400;
const REMAINING_NOTICE_AT = 3;

type ComposerProps = {
  // True while an answer streams or the conversation is blocked.
  disabled: boolean;
  // The box itself is locked only when the conversation is blocked, so focus
  // survives while an answer streams.
  locked: boolean;
  // Owned by AvatarChat, which also refocuses it after a suggested question.
  inputRef: RefObject<HTMLTextAreaElement | null>;
  remaining: number | null;
  onSend: (question: string) => void;
};

export default function Composer({
  disabled,
  locked,
  inputRef,
  remaining,
  onSend
}: ComposerProps) {
  const t = useTranslations('Ask');
  const [text, setText] = useState('');
  const max = CHAT_LIMITS.userTextMax;

  const submit = () => {
    const question = text.trim();
    if (!question || disabled) return;
    onSend(question);
    setText('');
    // The send button may have taken the focus; typing continues in the box.
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="sticky bottom-0 space-y-2 border-t border-border bg-card px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6"
    >
      {remaining !== null && remaining <= REMAINING_NOTICE_AT && (
        <p className="text-xs text-muted-foreground">
          {t('remaining', {count: remaining})}
        </p>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="ask-input" className="sr-only">
            {t('inputLabel')}
          </label>
          <textarea
            id="ask-input"
            ref={inputRef}
            disabled={locked}
            rows={2}
            value={text}
            maxLength={max}
            placeholder={t('placeholder')}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              // isComposing: Enter confirms an IME candidate, it is not a send.
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submit();
              }
            }}
            // 16px stops iOS Safari from zooming in when the box gets focus.
            className="w-full resize-none rounded-lg border border-border bg-background/60 px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label={t('send')}
          title={t('send')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
      {text.length >= COUNTER_FROM && (
        <p className="text-right text-xs text-muted-foreground">
          {t('charCount', {count: text.length, max})}
        </p>
      )}
    </form>
  );
}
