'use client';

import {cn} from '@/lib/utils';
import {useState, useTransition} from 'react';
import {Languages, Menu, X} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, usePathname, useRouter} from '@/i18n/navigation';

const routes = [
  {href: '/', key: 'home'},
  {href: '/about', key: 'about'},
  {href: '/projects', key: 'projects'},
  {href: '/contact', key: 'contact'}
] as const;

export default function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const router = useRouter();
  // Pathname without the locale prefix, e.g. "/projects" for "/es/projects".
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitching, startTransition] = useTransition();

  const switchLanguage = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  };

  const languageButton = (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={isSwitching}
      aria-label={t('switchLanguage')}
      title={t('switchLanguage')}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
    >
      <Languages size={16} />
      {t('otherLanguage')}
    </button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            DT<span className="text-primary">.</span>
          </Link>
          <ul className="hidden md:flex items-center gap-8">
            {routes.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary relative py-2',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {t(item.key)}
                  {pathname === item.href && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              </li>
            ))}
            <li>{languageButton}</li>
          </ul>

          <div className="md:hidden flex items-center gap-4">
            {languageButton}
            <button
              className="text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={t('toggleMenu')}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <ul className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            {routes.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary block py-2',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
