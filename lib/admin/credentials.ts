import 'server-only';
import {createHash, timingSafeEqual} from 'node:crypto';

// Admin sign-in uses ADMIN_USERNAME and ADMIN_PASSWORD, set as environment
// variables in Vercel. They are never part of the code or the client bundle.

const digest = (value: string) => createHash('sha256').update(value).digest();

export const isLoginConfigured = () =>
  Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);

// Compares fixed-length digests in constant time, so response timing does not
// reveal how much of the username or password matched.
export function verifyCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;

  const userMatches = timingSafeEqual(digest(username), digest(expectedUser));
  const passwordMatches = timingSafeEqual(
    digest(password),
    digest(expectedPassword)
  );
  return userMatches && passwordMatches;
}
