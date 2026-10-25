'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {
  Bot,
  Check,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  Loader2,
  Mail,
  MapPin,
  Send,
  Users
} from 'lucide-react';
import {SocialNetworks} from '@/app/components/SocialNetworks';

const EMAIL = 'd.tapialopez1@gmail.com';

const helpItems = [
  {key: 'cloud', icon: Cloud},
  {key: 'fullstack', icon: Code2},
  {key: 'ai', icon: Bot},
  {key: 'leadership', icon: Users}
] as const;

const emptyForm = {name: '', email: '', message: ''};

const inputClassName =
  'w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary';

export default function Contact() {
  const t = useTranslations('Contact');
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const updateField =
    (field: keyof typeof emptyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData({...formData, [field]: event.target.value});

  const copyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setHasError(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to send message.');
      }

      setSubmitted(true);
      setFormData(emptyForm);
    } catch (err) {
      // The API answers in English; show a translated message instead.
      console.error(err);
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-14 max-w-3xl space-y-5 animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Mail size={14} />
            {t('eyebrow')}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            {t('title')}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t.rich('intro', {
              highlight: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              )
            })}
          </p>
        </header>

        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div
            className="space-y-10 animate-fade-up"
            style={{animationDelay: '150ms'}}
          >
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('directTitle')}
              </h2>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="text-primary" size={20} />
                </div>
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex-1 font-medium text-foreground transition-colors hover:text-primary"
                  aria-label={t('emailButtonLabel')}
                >
                  {t('emailLabel')}
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label={t('copyEmail')}
                  title={t('copyEmail')}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {isCopied ? (
                    <Check size={16} className="text-primary" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <span className="sr-only" aria-live="polite">
                  {isCopied ? t('copied') : ''}
                </span>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('locationLabel')}
                  </p>
                  <p className="text-foreground">{t('location')}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-3 text-sm text-muted-foreground">
                  {t('findMe')}
                </p>
                <SocialNetworks />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('helpTitle')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {helpItems.map(({key, icon: Icon}) => (
                  <div
                    key={key}
                    className="group rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/50"
                  >
                    <Icon
                      size={20}
                      className="mb-3 text-primary transition-transform group-hover:scale-110"
                    />
                    <h3 className="mb-1 font-medium text-foreground">
                      {t(`help.${key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`help.${key}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div
            className="rounded-2xl bg-gradient-to-br from-primary/50 via-border to-border p-px shadow-[0_25px_80px_-30px_var(--primary)] animate-fade-up"
            style={{animationDelay: '300ms'}}
          >
            <div className="rounded-2xl bg-card p-6 md:p-8">
              {submitted ? (
                <div className="flex min-h-[28rem] flex-col items-center justify-center space-y-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-fade-up">
                    <CheckCircle2 className="text-primary" size={30} />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {t('success.title')}
                  </h2>
                  <p className="max-w-sm text-muted-foreground">
                    {t('success.body')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('success.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {t('form.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('form.subtitle')}
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-foreground"
                      >
                        {t('form.name')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={updateField('name')}
                        className={inputClassName}
                        placeholder={t('form.namePlaceholder')}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-foreground"
                      >
                        {t('form.email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={updateField('email')}
                        className={inputClassName}
                        placeholder={t('form.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t('form.message')}
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={updateField('message')}
                      className={`${inputClassName} resize-none`}
                      placeholder={t('form.messagePlaceholder')}
                    />
                  </div>

                  {hasError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {t('form.error')}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground shadow-[0_0_30px_-8px_var(--primary)] transition-all hover:shadow-[0_0_40px_-4px_var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {t('form.sending')}
                      </>
                    ) : (
                      <>
                        {t('form.submit')}
                        <Send
                          size={18}
                          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
