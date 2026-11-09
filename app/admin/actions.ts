'use server';

import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {isLoginConfigured, verifyCredentials} from '@/lib/admin/credentials';
import {safeAdminPath} from '@/lib/admin/require-admin';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken
} from '@/lib/admin/session';
import {INTERNAL_TRAFFIC_COOKIE} from '@/lib/analytics/events';

// The username is returned on failure so the form keeps it; never the password.
export type LoginState = {error?: string; username?: string};

// Every attempt takes at least this long, which slows down password guessing.
const MIN_ATTEMPT_MS = 800;
const MAX_FIELD_LENGTH = 256;
const isProduction = process.env.NODE_ENV === 'production';

const waitUntil = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.max(0, time - Date.now())));

export async function login(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  const startedAt = Date.now();

  if (!isLoginConfigured()) {
    return {error: 'Sign-in is not configured on this deployment.'};
  }

  const username = formData.get('username');
  const password = formData.get('password');
  const isValid =
    typeof username === 'string' &&
    typeof password === 'string' &&
    username.length > 0 &&
    password.length > 0 &&
    username.length <= MAX_FIELD_LENGTH &&
    password.length <= MAX_FIELD_LENGTH &&
    verifyCredentials(username, password);

  await waitUntil(startedAt + MIN_ATTEMPT_MS);
  // Same message for either field, so the username cannot be confirmed.
  if (!isValid) {
    return {
      error: 'The username or password is not correct.',
      username: typeof username === 'string' ? username.slice(0, MAX_FIELD_LENGTH) : ''
    };
  }

  const token = await createSessionToken();
  if (!token) return {error: 'Sign-in is not configured on this deployment.'};

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/admin',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  });
  // Marks this browser as the owner's so its visits are not tracked.
  jar.set(INTERNAL_TRAFFIC_COOKIE, '1', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });

  redirect(safeAdminPath(formData.get('next')));
}

export async function logout() {
  const jar = await cookies();
  jar.delete({name: ADMIN_SESSION_COOKIE, path: '/admin'});
  redirect('/admin/login');
}
