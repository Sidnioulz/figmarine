import fs from 'node:fs';

import { createCache } from 'cache-manager';
import { DiskStore } from 'cache-manager-fs-hash';

import { log } from '@figmarine/logger';

import { cachePath } from './constants';

log(`Loading REST API cache from location ${cachePath}`);
fs.mkdirSync(cachePath, { recursive: true });
const diskCache = createCache(
  new DiskStore({
    path: cachePath,
    ttl: process.env.NODE_ENV === 'production' ? 10 * 1000 : undefined,
  }),
);
log(
  `Created cache with ${process.env.NODE_ENV === 'production' ? '10 second TTL' : 'infinite TTL (dev mode)'}`,
);

function cache<T, U extends Record<string, unknown>>(
  prefix: string,
  callback: (params: U) => Promise<T>,
) {
  console.log('cache fn ctor called', prefix);
  return async (cbParams: U) => {
    const key = `${prefix}:${JSON.stringify(cbParams)}`;
    console.log('cache cb called', prefix, key);

    return await diskCache.wrap<T>(key, () => callback(cbParams));
  };
}

export { diskCache, cache };
