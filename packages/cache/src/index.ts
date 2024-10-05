import fs from 'node:fs';
import path from 'node:path';

import { Cacheable } from 'cacheable';
import { Keyv } from 'keyv';
import { KeyvFile } from 'keyv-file';
import KeyvGzip from '@keyv/compress-gzip';
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
   * TTL, in seconds, for the cache.
   * Pass -1 to keep files for as long as a year.
   * @type {number}
   * @default 10
   */
  ttl?: number;
}

export function makeCache(opts: MakeCacheOptions) {
  const { ttl = -1, location } = opts;

  const writeDelay = 100;

  const finalCacheDirname = path.isAbsolute(location)
    ? location
    : path.join(DEFAULT_CACHE_PATH, location);
  const finalCacheFilename = path.join(finalCacheDirname, 'cache.json.gz');
  log(`Initialising / reloading cache from location ${finalCacheFilename}`);
  fs.mkdirSync(finalCacheDirname, { recursive: true });

  const computedTtl = 1000 * (ttl === -1 ? YEAR_IN_SECONDS : ttl);

  const store = new KeyvFile({
    filename: finalCacheFilename,
    expiredCheckDelay: computedTtl,
    writeDelay,
  });

  const shutdownGracefully = async () => {
    cache.disconnect();

    // Connect to PRE_SET hook
    const pendingWrites = new Set();
    const countHandled = (key: string) => {
      pendingWrites.add(key);
    };
    primary.on('postSet', countHandled);

    // Wait for the grace period
    await new Promise((resolve) => setTimeout(resolve, writeDelay * 3));

    primary.off('preSet', countHandled);
    log(`Graceful shutdown completed. Processed ${pendingWrites.size} pending writes.`);
  };

  const primary = new Keyv({ compression: new KeyvGzip(), store, ttl: computedTtl });
  const cache = new Cacheable({ primary });

  log(`Created cache with ${ttl === -1 ? 'infinite TTL (dev mode)' : `${ttl} second TTL`}`);

  return { cache, primary, shutdownGracefully };
}
