import {NextResponse, type NextRequest} from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {ADMIN_SESSION_COOKIE, verifySessionToken} from './lib/admin/session';

const intlMiddleware = createMiddleware(routing);

const isAdminPath = (pathname: string) =>
  pathname === '/admin' || pathname.startsWith('/admin/');

// First line of defence for the admin area; pages check the session again.
async function adminGate(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isSignedIn = await verifySessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );

  let response: NextResponse;
  if (!isSignedIn && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname + search);
    response = NextResponse.redirect(loginUrl);
  } else if (isSignedIn && isLoginPage) {
    response = NextResponse.redirect(new URL('/admin/analytics', request.url));
  } else {
    response = NextResponse.next();
  }

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export default function proxy(request: NextRequest) {
  if (isAdminPath(request.nextUrl.pathname)) return adminGate(request);
  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, Next.js internals, Vercel internals and files with an extension.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)'
};
