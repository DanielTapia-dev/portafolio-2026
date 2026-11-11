import {useTranslations} from 'next-intl';

const suggestionKeys = [
  'falabella',
  'stack',
  'leadership',
  'project',
  'certifications',
  'remote'
] as const;

type SuggestedQuestionsProps = {
  onPick: (question: string) => void;
};

export default function SuggestedQuestions({onPick}: SuggestedQuestionsProps) {
  const t = useTranslations('Ask');

  return (
    <section aria-label={t('suggestionsLabel')}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('suggestionsLabel')}
      </p>
      <ul className="flex flex-wrap gap-2">
        {suggestionKeys.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onPick(t(`suggestions.${key}`))}
              className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t(`suggestions.${key}`)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
