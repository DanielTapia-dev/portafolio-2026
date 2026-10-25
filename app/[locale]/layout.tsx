import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {Inter, Geist_Mono} from 'next/font/google';
import {Analytics} from '@vercel/analytics/next';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import '../globals.css';
import Header from '../components/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

type LocaleParams = {params: Promise<{locale: string}>};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: LocaleParams): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({locale, namespace: 'Metadata'});

  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<LocaleParams & {children: React.ReactNode}>) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for every page under this layout.
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
