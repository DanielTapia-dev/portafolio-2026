import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from 'next-intl';
import {Sparkles} from 'lucide-react';
import AvatarChat from '@/app/components/avatar/AvatarChat';
import ProfileAvatar from '@/app/components/ProfileAvatar';

const noticeKeys = [
  'ai',
  'storage',
  'processing',
  'personalData',
  'contact'
] as const;

export default async function AskPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('Ask');

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-3xl space-y-10 px-6">
        <header className="space-y-5 text-center animate-fade-up motion-reduce:animate-none">
          <ProfileAvatar src="/Profile.jpg" alt={t('avatarAlt')} />
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles size={14} aria-hidden="true" />
            {t('aiBadge')} · {t('eyebrow')}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t('title')}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('intro')}
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card/60 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('notice.title')}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {noticeKeys.map((key) => (
              <li key={key}>{t(`notice.${key}`)}</li>
            ))}
          </ul>
        </section>

        <AvatarChat />
      </div>
    </div>
  );
}
