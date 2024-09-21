import type { Cacheable } from 'cacheable';
import type { InternalAxiosRequestConfig } from 'axios';
import type { KeyGenerator } from 'axios-cache-interceptor';

import { interceptRequest } from './rateLimit';

export function rateLimitRequestInterceptor(
  keyGenerator: KeyGenerator,
  diskCache: Cacheable | undefined,
) {
  return async function (config: InternalAxiosRequestConfig) {
    // If we have cache for the request, no need to consider rate limiting.
    const cacheHit = diskCache && (await diskCache.get<string>(keyGenerator(config)));

    if (!cacheHit) {
      // Until Figma shed light on their actual rate limit implementation, all
      // requests have the same cost. Wait for the request to be allowed to run
      // to exit the Axios interceptor.
      await interceptRequest(1);
    }

    return config;
  };
}
