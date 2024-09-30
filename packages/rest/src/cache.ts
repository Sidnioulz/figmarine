import {
  buildStorage,
  type CacheRequestConfig,
  type NotEmptyStorageValue,
  setupCache,
} from 'axios-cache-interceptor';
import { makeCache, type MakeCacheOptions } from '@figmarine/cache';
import type { Cacheable } from 'cacheable';
import type { ClientInterface } from './client';
import type { Keyv } from 'keyv';
import { log } from '@figmarine/logger';

export type ClientCacheOptions =
  | false
  | (Exclude<MakeCacheOptions, 'location'> & { location?: MakeCacheOptions['location'] });

const KEY_SEPARATOR = ' @ ';

export function generatePredictableKey({ url, method, params, data }: CacheRequestConfig): string {
  return `${method?.toUpperCase() ?? 'GET'}${KEY_SEPARATOR}${url ?? '/'}${KEY_SEPARATOR}${JSON.stringify(params) ?? '-'}${KEY_SEPARATOR}${JSON.stringify(data) ?? '-'}`;
}

export class Cache {
  #client: ClientInterface;
  #cache: Cacheable;
  #primaryStore: Keyv;

  constructor(c: ClientInterface, opts?: ClientCacheOptions) {
    this.#client = c;

    log(`API cache middleware: Creating Cacheable instance.`);
    const { cache, primary } = makeCache({ location: 'rest', ttl: -1, ...(opts ?? {}) });
    this.#cache = cache;
    this.#primaryStore = primary;

    log(`API cache middleware: Setting up cache interceptor on Axios client.`);
    setupCache(this.#client.instance, {
      /**
       * Ignore "don't cache" headers from Figma by default.
       * Let the cache package handle TTL for us, and cache
       * invalidation logic clear stale cache.
       * @returns A 999999999999 seconds TTL.
       */
      headerInterpreter: () => 999999999999,

      /**
       * Our cache package is used as a storage middleware for
       * the Axios cache, allowing us to save API results to disk
       * between two runs of the program in development mode.
       */
      storage: buildStorage({
        clear: async () => await this.clear(),
        find: async (key) => await this.get(key),
        remove: async (key) => await this.delete(key),
        set: async (key, value) => await this.set(key, value),
      }),

      /**
       * We customise the cache key so that if someone wants to
       * iterate over cached data and manually invalidate it, they
       * can make sense of it. The axios-cache-interceptor recommended
       * approach is harder to use in our generated client; adding a
       * `cache.update` param messes with our TS types too much.
       */
      generateKey: generatePredictableKey,
    });
  }

  async get(key: string) {
    const value = await this.#cache.get<string>(key);
    log(`API cache middleware: getting '${key}', cache ${value ? 'hit' : 'miss'}.`);

    return value ? JSON.parse(value) : undefined;
  }

  async has(key: string): Promise<boolean> {
    const found = await this.#cache.has(key);
    log(`API cache middleware: looked up '${key}', cache ${found ? 'hit' : 'miss'}.`);

    return found;
  }

  async set(key: string, value: NotEmptyStorageValue) {
    log(`API cache middleware: setting '${key}'.`);
    await this.#cache.set(key, JSON.stringify(value));
  }

  async delete(key: string) {
    log(`API cache middleware: deleting '${key}'.`);
    await this.#cache.delete(key);
  }

  async clear() {
    log('API cache middleware: resetting.');
    await this.#cache.clear();
  }

  getCache() {
    return this.#cache;
  }

  async *iterator() {
    log('API cache middleware: iterating over primary store.');
    if (this.#primaryStore.iterator === undefined) {
      throw new Error(
        'API cache middleware: Keyv store is missing an iterator, cannot be used. Please report a bug on the figmarine repository.',
      );
    }

    for await (const [key, value] of this.#primaryStore.iterator(undefined)) {
      yield [key, value];
    }
  }
}
