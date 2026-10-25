import {ArrowRight} from 'lucide-react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {SocialNetworks} from '../components/SocialNetworks';
import TypewriterRoles from '../components/TypewriterRoles';

const navItems = [
  {href: '/about', key: 'about'},
  {href: '/projects', key: 'projects'},
  {href: '/contact', key: 'contact'}
] as const;

const roleKeys = ['fullstack', 'frontend', 'cloud'] as const;

// Milliseconds after page load at which each hero element starts animating.
const LETTER_STAGGER_MS = 45;
const FIRST_NAME_DELAY = 200;
const LAST_NAME_DELAY = FIRST_NAME_DELAY + 'Daniel'.length * LETTER_STAGGER_MS;
const CONTENT_DELAY =
  LAST_NAME_DELAY + 'Tapia'.length * LETTER_STAGGER_MS + 150;

const delay = (ms: number) => ({animationDelay: `${ms}ms`});

function AnimatedWord({
  word,
  startDelay,
  className
}: {
  word: string;
  startDelay: number;
  className?: string;
}) {
  return (
    <span className={cn('block', className)}>
      {word.split('').map((letter, index) => (
        <span
          key={index}
          className="inline-block animate-letter-in"
          style={delay(startDelay + index * LETTER_STAGGER_MS)}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)'
        }}
      />
      <div className="absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-3xl animate-aurora" />
      <div
        className="absolute -bottom-48 -right-40 h-[36rem] w-[36rem] rounded-full bg-sky-500/10 blur-3xl animate-aurora"
        style={delay(-9000)}
      />
    </div>
  );
}

export default async function Home({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  // The [locale] layout has already rejected unsupported locales.
  setRequestLocale(locale as Locale);
  const t = await getTranslations('Home');

  return (
    <section className="relative isolate flex min-h-screen items-center overflow-hidden">
      <HeroBackground />

      <div className="mx-auto w-full max-w-6xl px-6 py-28 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-8">
            <p
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-fade-up"
              style={delay(0)}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {t('availability')}
            </p>

            <div className="space-y-4">
              <p
                className="font-mono text-primary animate-fade-up"
                style={delay(100)}
              >
                {t('greeting')}
              </p>
              {/* Letters are split for the animation; the label keeps the name readable. */}
              <h1
                aria-label="Daniel Tapia"
                className="text-[clamp(3.5rem,11vw,8rem)] font-bold leading-[0.9] tracking-tighter"
              >
                <span aria-hidden>
                  <AnimatedWord
                    word="Daniel"
                    startDelay={FIRST_NAME_DELAY}
                    className="text-foreground"
                  />
                  <AnimatedWord
                    word="Tapia"
                    startDelay={LAST_NAME_DELAY}
                    className="text-primary drop-shadow-[0_0_35px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
                  />
                </span>
              </h1>
              <h2
                className="min-h-[1.3em] text-2xl font-semibold text-muted-foreground animate-fade-up md:text-3xl"
                style={delay(CONTENT_DELAY)}
              >
                <TypewriterRoles
                  roles={roleKeys.map((key) => t(`roles.${key}`))}
                />
              </h2>
            </div>

            <p
              className="max-w-md leading-relaxed text-muted-foreground animate-fade-up"
              style={delay(CONTENT_DELAY + 150)}
            >
              {t('intro')}
            </p>

            <div
              className="flex flex-col gap-4 animate-fade-up sm:flex-row"
              style={delay(CONTENT_DELAY + 300)}
            >
              <Link
                href="/projects"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-[0_0_30px_-8px_var(--primary)] transition-all hover:shadow-[0_0_40px_-4px_var(--primary)]"
              >
                {t('viewProjects')}
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                {t('contactMe')}
              </Link>
            </div>

            <div
              className="pt-2 animate-fade-up"
              style={delay(CONTENT_DELAY + 450)}
            >
              <SocialNetworks />
            </div>
          </div>

          <nav className="hidden flex-col gap-4 md:flex">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-lg border border-border bg-background/40 p-4 backdrop-blur-sm transition-all animate-fade-up hover:border-primary/50 hover:bg-card"
                style={delay(CONTENT_DELAY + 200 + index * 120)}
              >
                <span className="h-0.5 w-12 bg-muted-foreground transition-all group-hover:w-20 group-hover:bg-primary" />
                <div>
                  <span className="text-sm font-semibold tracking-wider text-foreground transition-colors group-hover:text-primary">
                    {t(`nav.${item.key}.label`)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {t(`nav.${item.key}.description`)}
                  </p>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
