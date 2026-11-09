// Signed admin session tokens. Uses Web Crypto only, so it runs both in the
// proxy and in server components. The token is `v1.<expiry>.<signature>`,
// where the signature is an HMAC-SHA256 of `v1.<expiry>`.
//
// The signing key is ADMIN_SESSION_SECRET when it is set (32+ characters).
// Otherwise it is derived from ADMIN_USERNAME and ADMIN_PASSWORD, so changing
// the password signs every session out.

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const TOKEN_VERSION = 'v1';
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();

export function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  return username && password
    ? `portfolio-admin-session:${username}:${password}`
    : null;
}

const toBase64Url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const importKey = (secret: string) =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign', 'verify']
  );

export async function createSessionToken(
  now = Date.now()
): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const expiry = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiry}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await importKey(secret),
    encoder.encode(payload)
  );
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  now = Date.now()
): Promise<boolean> {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const [version, expiry, signature, ...rest] = token.split('.');
  if (rest.length || version !== TOKEN_VERSION || !/^\d+$/.test(expiry ?? '')) {
    return false;
  }
  if (Number(expiry) <= Math.floor(now / 1000)) return false;

  const signatureBytes = fromBase64Url(signature ?? '');
  if (!signatureBytes) return false;

  // HMAC verification compares in constant time.
  return crypto.subtle.verify(
    'HMAC',
    await importKey(secret),
    signatureBytes,
    encoder.encode(`${version}.${expiry}`)
  );
}
