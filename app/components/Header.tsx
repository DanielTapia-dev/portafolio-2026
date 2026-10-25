'use client';

import {cn} from '@/lib/utils';
import {useEffect, useState, useTransition} from 'react';
import {Languages, Menu, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, usePathname, useRouter} from '@/i18n/navigation';

const routes = [
  {href: '/', key: 'home'},
  {href: '/about', key: 'about'},
  {href: '/projects', key: 'projects'},
  {href: '/contact', key: 'contact'}
] as const;

// Scroll distance after which the header gets its blurred background.
const SCROLLED_OFFSET = 16;

type Highlight = {left: number; width: number; isVisible: boolean};

export default function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const router = useRouter();
  // Pathname without the locale prefix, e.g. "/projects" for "/es/projects".
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSwitching, startTransition] = useTransition();
  // Pill that slides behind the hovered nav link.
  const [highlight, setHighlight] = useState<Highlight>({
    left: 0,
    width: 0,
    isVisible: false
  });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > SCROLLED_OFFSET);
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchLanguage = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  };

  const moveHighlight = (event: React.MouseEvent<HTMLElement>) => {
    const {offsetLeft, offsetWidth} = event.currentTarget;
    setHighlight({left: offsetLeft, width: offsetWidth, isVisible: true});
  };

  const languageButton = (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={isSwitching}
      aria-label={t('switchLanguage')}
      title={t('switchLanguage')}
      className="group inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:shadow-[0_0_20px_-6px_var(--primary)] disabled:opacity-50"
    >
      <Languages
        size={14}
        className="transition-transform duration-300 group-hover:rotate-12"
      />
      {t('otherLanguage')}
    </button>
  );

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 animate-fade-down',
        isScrolled || isMenuOpen
          ? 'border-border bg-background/80 backdrop-blur-md'
          : 'border-transparent bg-transparent'
      )}
    >
      <nav className="mx-auto max-w-6xl px-6 py-3.5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label={`Daniel Tapia, ${t('home')}`}
            className="group flex items-center gap-3"
          >
            {/* Monogram with the same gradient ring as the profile avatar. */}
            <span className="relative">
              <span className="absolute -inset-1.5 rounded-xl bg-primary/30 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative block rounded-xl bg-gradient-to-br from-primary via-sky-500/60 to-border p-px transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-110">
                <span className="flex h-9 w-9 items-baseline justify-center rounded-[11px] bg-background pt-2 text-sm font-bold tracking-tight text-foreground">
                  DT
                  {/* The brand dot: glows and hops on hover. */}
                  <span className="ml-px h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] transition-transform duration-300 group-hover:-translate-y-1" />
                </span>
              </span>
            </span>
            <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold text-foreground opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-32 group-hover:opacity-100 sm:block">
              Daniel Tapia
            </span>
          </Link>

          <ul
            className="relative hidden items-center gap-1 md:flex"
            onMouseLeave={() =>
              setHighlight((current) => ({...current, isVisible: false}))
            }
          >
            <span
              aria-hidden
              className={cn(
                'absolute inset-y-0 rounded-full border border-primary/20 bg-primary/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                highlight.isVisible ? 'opacity-100' : 'opacity-0'
              )}
              style={{left: highlight.left, width: highlight.width}}
            />
            {routes.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href} onMouseEnter={moveHighlight}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative block px-4 py-2 text-sm font-medium transition-colors',
                      // Active underline grows from the center with a soft glow.
                      'after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-primary after:shadow-[0_0_10px_var(--primary)] after:transition-transform after:duration-300',
                      isActive
                        ? 'text-primary after:scale-x-100'
                        : 'text-muted-foreground after:scale-x-0 hover:text-foreground'
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
            <li
              className="ml-3"
              onMouseEnter={() =>
                setHighlight((current) => ({...current, isVisible: false}))
              }
            >
              {languageButton}
            </li>
          </ul>

          <div className="flex items-center gap-3 md:hidden">
            {languageButton}
            <button
              type="button"
              className="relative h-9 w-9 rounded-lg border border-border text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={t('toggleMenu')}
              aria-expanded={isMenuOpen}
            >
              <Menu
                size={20}
                className={cn(
                  'absolute inset-0 m-auto transition-all duration-300',
                  isMenuOpen ? 'rotate-90 opacity-0' : 'opacity-100'
                )}
              />
              <X
                size={20}
                className={cn(
                  'absolute inset-0 m-auto transition-all duration-300',
                  isMenuOpen ? 'opacity-100' : '-rotate-90 opacity-0'
                )}
              />
            </button>
          </div>
        </div>

        {/* Animates its height by transitioning the grid row from 0fr to 1fr. */}
        <div
          inert={!isMenuOpen}
          className={cn(
            'grid transition-[grid-template-rows] duration-300 md:hidden',
            isMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <ul className="flex flex-col gap-1 overflow-hidden">
            {routes.map((item, index) => {
              const isActive = pathname === item.href;

              return (
                <li
                  key={item.href}
                  className={cn(
                    'transition-all duration-300',
                    index === 0 && 'mt-4',
                    index === routes.length - 1 && 'mb-2',
                    isMenuOpen
                      ? 'translate-x-0 opacity-100'
                      : '-translate-x-4 opacity-0'
                  )}
                  style={{
                    transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms'
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-card hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'h-px transition-all',
                        isActive ? 'w-6 bg-primary' : 'w-3 bg-muted-foreground'
                      )}
                    />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
