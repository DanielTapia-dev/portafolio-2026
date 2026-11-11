import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // The avatar reads the CV at runtime, so the bundler must ship it with the route.
  outputFileTracingIncludes: {
    '/api/avatar/chat': ['./content/profile/cv.md']
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
