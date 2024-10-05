import type { InternalAxiosRequestConfig } from 'axios';
import { log } from '@figmarine/logger';

import { Cache, generatePredictableKey } from './cache';
import { interceptRequest } from './rateLimit';

export function cacheInvalidationRequestInterceptor(cache: Cache) {
  return async function (config: InternalAxiosRequestConfig) {
    const normalisedMethod = config.method?.toLowerCase() ?? 'get';
    if (normalisedMethod !== 'get') {
      log(
        `Cache Invalidation: request ${config.method} ${config.url} may have changed some remote data, invalidating local request cache.`,
      );
      cache.clear();
    }

    return config;
  };
}

export function rateLimitRequestInterceptor(cache: Cache | undefined) {
  return async function (config: InternalAxiosRequestConfig) {
    // If we have cache for the request, no need to consider rate limiting.
    const cacheHit = cache && (await cache.has(generatePredictableKey(config)));

    if (!cacheHit) {
      // Until Figma shed light on their actual rate limit implementation, all
      // requests have the same cost. Wait for the request to be allowed to run
      // to exit the Axios interceptor.
      await interceptRequest(1);
    }

    return config;
  };
}
