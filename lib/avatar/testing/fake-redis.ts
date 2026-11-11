import type {AvatarRedis} from '../redis';

// In-memory stand-in for tests. Expiry is checked lazily against the injected
// clock so tests can move time without timers.
export function createFakeRedis(options: {now?: () => number; failing?: boolean} = {}): AvatarRedis {
  const now = options.now ?? Date.now;
  const values = new Map<string, string | number>();
  const deadlines = new Map<string, number>();

  const guard = () => {
    if (options.failing) throw new Error('fake redis failure');
  };
  const alive = (key: string): boolean => {
    const deadline = deadlines.get(key);
    if (deadline !== undefined && now() >= deadline) {
      values.delete(key);
      deadlines.delete(key);
    }
    return values.has(key);
  };
  const read = (key: string) => (alive(key) ? values.get(key) ?? null : null);
  const add = (key: string, amount: number) => {
    const next = Number(read(key) ?? 0) + amount;
    values.set(key, next);
    return next;
  };

  return {
    async get(key) {
      guard();
      return read(key);
    },
    async mget(keys) {
      guard();
      return keys.map(read);
    },
    async set(key, value, opts) {
      guard();
      if (opts?.nx && alive(key)) return null;
      values.set(key, value);
      if (opts?.ex !== undefined) deadlines.set(key, now() + opts.ex * 1000);
      else deadlines.delete(key);
      return 'OK';
    },
    async incr(key) {
      guard();
      return add(key, 1);
    },
    async incrby(key, amount) {
      guard();
      return add(key, amount);
    },
    async expire(key, seconds) {
      guard();
      if (!alive(key)) return 0;
      deadlines.set(key, now() + seconds * 1000);
      return 1;
    },
    async del(key) {
      guard();
      const existed = alive(key);
      values.delete(key);
      deadlines.delete(key);
      return existed ? 1 : 0;
    },
  };
}
