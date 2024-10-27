import type { InternalAxiosRequestConfig } from 'axios';
import { log } from '@figmarine/logger';

import { Cache, generatePredictableKey } from './cache';
import { interceptRequest } from './rateLimit';
import manifest from '../package.json';

function detectRuntime(): string {
  if (typeof globalThis === 'undefined') {
    return 'Unknown runtime (likely legacy)';
  }

  if ('Netlify' in globalThis) {
    return 'netlify';
  }

  if ('__lagon__' in globalThis) {
    return 'lagon';
  }

  if ('EdgeRuntime' in globalThis) {
    return 'edge-light';
  }

  if ('fastly' in globalThis) {
    return 'fastly';
  }

  // @ts-expect-error Runtime dependant global.
  if ('Deno' in globalThis && globalThis.Deno.version.deno) {
    // @ts-expect-error Runtime dependant global.
    return `deno v${globalThis.Deno.version.deno}`;
  }

  // @ts-expect-error Runtime dependant global.
  if ('Bun' in globalThis && globalThis.Bun.version) {
    // @ts-expect-error Runtime dependant global.
    return `bun v${globalThis.Bun.version}`;
  }

  if ('process' in globalThis && globalThis.process.versions?.node) {
    return `node v${process.versions.node}`;
  }

  if ('window' in globalThis) {
    return 'Browser';
  }

  return 'unknown';
}

export function userAgentRequestInterceptor() {
  const runtime = detectRuntime();
  const version = manifest.version.startsWith('0.0.0') ? 'git' : manifest.version;
  const userAgent = `figmarine-rest/${version} (${runtime} runtime)`;
  log(`Detected User-Agent: ${userAgent}.`);

  return function (config: InternalAxiosRequestConfig) {
    config.headers = config.headers || {};
    config.headers['User-Agent'] = userAgent;
    return config;
  };
}

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
