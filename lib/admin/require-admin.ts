import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {ADMIN_SESSION_COOKIE, verifySessionToken} from './session';

export const ADMIN_HOME = '/admin/analytics';

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

// Second line of defence after the proxy: every admin page and every server
// function that reads analytics calls this before doing anything else.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

// Only same-site admin paths are allowed as post-login destinations.
export function safeAdminPath(value: unknown): string {
  if (typeof value !== 'string') return ADMIN_HOME;
  if (!value.startsWith('/admin/') || value.startsWith('/admin/login')) {
    return ADMIN_HOME;
  }
  if (value.includes('//') || value.includes('\\')) return ADMIN_HOME;
  return value;
}
