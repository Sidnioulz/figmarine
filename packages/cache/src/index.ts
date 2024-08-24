import fs from 'node:fs';
import path from 'node:path';

import { createCache } from 'cache-manager';
import { DiskStore } from 'cache-manager-fs-hash';

import { log } from '@figmarine/logger';

import { DEFAULT_CACHE_PATH, YEAR_IN_SECONDS } from './constants';

/**
 * Options for the {@link makeCache} function.
 */
export interface MakeCacheOptions {
  /**
   * Path to where the cache must be stored. If the path is relative,
   * then the cache is written to `/tmp/@figmarine/cache/${location}`.
   * @type {string}
   */
  location: string;

  /**
   * Maximum number of items to keep in the cache.
   * @type {number}
   * @default 200
   */
  max?: number;

  /**
   * Refresh threshold. If `ttl` is lower as a file is fetched, it will
   * be refreshed asynchronously.
   * @see https://github.com/jaredwray/cacheable/tree/main/packages/cache-manager#refresh-cache-keys-in-background
   * @type {number}
   * @default 3
   */
  refreshThreshold?: number;

  /**
   * TTL, in seconds, for the cache.
   * Pass -1 to keep files for as long as a year.
   * @type {number}
   * @default 10
   */
  ttl?: number;
}

/**
 * Creates a new disk cache, with options to control the location, TTL,
 * maximum size and refresh threshold of the cache.
 *
 * Also provides a wrapper function that can wrap arbitrary callbacks'
 * return value into the cache so long as callback parameters are a
 * serialisable object.
 *
 * @param {MakeCacheOptions} opts The options for the cache to create.
 * @returns {object} An object with two properties:
 * - `diskCache` is the underlying [cache-manager](https://www.npmjs.com/package/cache-manager?activeTab=readme) instance.
 * - `cacheWrapper` is the function used to wrap callbacks.
 */
export function makeCache(opts: MakeCacheOptions) {
  const { ttl = -1, location, max = 200, refreshThreshold = undefined } = opts;

  log(`Initialising / reloading cache from location ${DEFAULT_CACHE_PATH}`);
  const finalCachePath = path.isAbsolute(location)
    ? location
    : path.join(DEFAULT_CACHE_PATH, location);
  fs.mkdirSync(finalCachePath, { recursive: true });

  const refreshErrorHandler = refreshThreshold
    ? (error: Error) => {
        log(error);
      }
    : undefined;

  const diskCache = createCache(
    new DiskStore({
      path: finalCachePath,
      max,
      refreshThreshold,
      onBackgroundRefreshError: refreshErrorHandler,
      ttl: 1000 * (ttl === -1 ? YEAR_IN_SECONDS : ttl),
    }),
  );
  log(`Created cache with ${ttl === -1 ? 'infinite TTL (dev mode)' : `${ttl} second TTL`}`);

  /**
   * Creates a wrapped version of a callback, so that when the callback is
   * called, the associated cache is first checked for a return value, and
   * so that callback return values are stored in the cache.
   * @param {string} prefix A prefix to use to compute the cache key for the
   * wrapped callback. The rest of the cache key is obtained by serialising
   * the callback parameters.
   * @param {Function} callback A callback with a single parameter typed `U`,
   * which must be serialisable, and an arbitrary return value of type `T`.
   * @returns {Function} A function with the same signature as {@link callback}
   * but wrapped in the cache made by {@link makeCache}.
   */
  function cacheWrapper<T, U>(prefix: string, callback: (params: U) => Promise<T>) {
    log(`Creating a new cache-wrapped function with prefix ${prefix}`);
    return async (cbParams: U) => {
      const key = `${prefix}:${JSON.stringify(cbParams)}`;
      log(`Cache-wrapped function '${prefix} called with params: ${cbParams}`);

      return await diskCache.wrap<T>(key, () => callback(cbParams));
    };
  }

  return { diskCache, cacheWrapper };
}
