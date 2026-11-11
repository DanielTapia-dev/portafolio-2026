import {Redis} from '@upstash/redis';
import type {AvatarConfig} from './config';

export interface AvatarRedis {
  get(key: string): Promise<unknown>;
  mget(keys: string[]): Promise<unknown[]>;
  set(key: string, value: string | number, options?: {ex?: number; nx?: boolean}): Promise<unknown>;
  incr(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

let instance: {key: string; redis: Redis} | null = null;

// One client per process, rebuilt only if the credentials change.
export function getUpstash(config: AvatarConfig): Redis {
  const key = `${config.redisUrl}|${config.redisToken}`;
  if (!instance || instance.key !== key) {
    instance = {key, redis: new Redis({url: config.redisUrl, token: config.redisToken})};
  }
  return instance.redis;
}

export function getAvatarRedis(config: AvatarConfig | null): AvatarRedis | null {
  if (!config) return null;
  const redis = getUpstash(config);
  return {
    get: (key) => redis.get(key),
    mget: (keys) => redis.mget(...keys),
    set: (key, value, options) => {
      // Upstash types ex/nx as a union, so only pass the options that are set.
      if (options?.ex !== undefined) return redis.set(key, value, options.nx ? {ex: options.ex, nx: true} : {ex: options.ex});
      return options?.nx ? redis.set(key, value, {nx: true}) : redis.set(key, value);
    },
    incr: (key) => redis.incr(key),
    incrby: (key, amount) => redis.incrby(key, amount),
    expire: (key, seconds) => redis.expire(key, seconds),
    del: (key) => redis.del(key),
  };
}
