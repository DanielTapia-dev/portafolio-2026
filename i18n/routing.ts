import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // English keeps the current URLs (/projects); Spanish lives under /es.
  localePrefix: 'as-needed'
});
