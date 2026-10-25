import {ArrowRight} from 'lucide-react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {SocialNetworks} from '../components/SocialNertworks';

const navItems = [
  {href: '/about', key: 'about'},
  {href: '/projects', key: 'projects'},
  {href: '/contact', key: 'contact'}
] as const;

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
    <div className="min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-primary font-medium">{t('greeting')}</p>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
                Daniel Tapia
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
                {t('role')}
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              {t('intro')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                {t('viewProjects')}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                {t('contactMe')}
              </Link>
            </div>

            <div className="pt-4">
              <SocialNetworks />
            </div>
          </div>
          <nav className="hidden md:flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-card transition-all"
              >
                <span className="w-12 h-0.5 bg-muted-foreground group-hover:w-20 group-hover:bg-primary transition-all" />
                <div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors tracking-wider">
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
    </div>
  );
}
