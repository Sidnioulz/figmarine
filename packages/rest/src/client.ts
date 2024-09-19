import { buildStorage, defaultKeyGenerator, setupCache } from 'axios-cache-interceptor';
import { makeCache, MakeCacheOptions } from '@figmarine/cache';
import type { AxiosRequestConfig } from 'axios';
import { log } from '@figmarine/logger';

import { Api, type Api as ApiInterface } from './__generated__/figmaRestApi';
import { interceptRequest } from './rateLimit';

export interface ClientOptions {
  /**
   * Cache options. If set to a truthy value, the cache is always enabled.
   * If set to `false`, the cache is always disabled.
   * @see https://github.com/Sidnioulz/figmarine/blob/main/packages/cache/README.md
   * @type {object | boolean}
   */
  cache?:
    | false
    | (Exclude<MakeCacheOptions, 'location'> & { location?: MakeCacheOptions['location'] });
  /**
   * Whether the REST API is used in a development or production project.
   * In development, API calls are cached by default to help you get work
   * done faster.
   * @type {string}
   */
  mode?: 'development' | 'production';
  /**
   * The OAuth token to use if you have authenticated to Figma via OAuth.
   * @type {string}
   */
  oauthToken?: string;
  /**
   * The personal access token to use if you choose not to use OAuth.
   * @type {string}
   */
  personalAccessToken?: string;
  /**
   * Whether to slow down API calls so that the Figma REST API's rate limit
   * policy isn't violated. Prevents errors when doing multiple consecutive calls.
   */
  rateLimit?: true;
}

export type ClientInterface = Omit<ApiInterface<ClientOptions>, 'setSecurityData'>;

export async function Client(opts: ClientOptions = {}): Promise<ClientInterface> {
  const {
    cache = undefined,
    mode = process.env.NODE_ENV,
    oauthToken = process.env.FIGMA_OAUTH_TOKEN,
    personalAccessToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
    rateLimit = true,
  } = opts;

  const isDevelopment = mode === 'development';

  if (!personalAccessToken && !oauthToken) {
    log('Cannot authenticate to client, no token passed');
    throw new Error(
      'You must set the environment variable FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_OAUTH_TOKEN, or pass `personalAccessToken` or `oauthToken` to this function.',
    );
  }

  if (oauthToken) {
    log(
      `Creating Figma REST client with OAuth token (${opts.oauthToken ? 'set programmatically' : 'from env'})`,
    );
  } else {
    log(
      `Creating Figma REST client with personal access token (${opts.personalAccessToken ? 'set programmatically' : 'from env'})`,
    );
  }

  const api = new Api<ClientOptions>({
    securityWorker: (securityData) => {
      if (!securityData) {
        return;
      }

      const headers: AxiosRequestConfig['headers'] = {};
      if (personalAccessToken) {
        headers['X-Figma-Token'] = securityData.personalAccessToken;
      }
      if (oauthToken) {
        headers['Authorization'] = `Bearer ${securityData.oauthToken}`;
      }

      return { headers };
    },
  });

  api.setSecurityData({
    oauthToken,
    personalAccessToken,
  });

  let diskCache: ReturnType<typeof makeCache>['diskCache'];
  if ((isDevelopment && cache !== false) || cache) {
    if (isDevelopment) {
      log(`Development mode: enabling API cache by default.`);
    } else {
      log(`Cache options passed: enabling API cache.`);
    }
    diskCache = makeCache({ location: 'rest', ttl: -1, ...(cache ?? {}) }).diskCache;

    log(`Setting up cache interceptor on Axios client.`);
    setupCache(api.instance, {
      /**
       * Ignore "don't cache" headers from Figma by default.
       * Let the cache package handle TTL for us, and cache
       * invalidation logic clear stale cache.
       * @returns {number} A 999999999999 seconds TTL.
       */
      headerInterpreter: () => 999999999999,
      /**
       * Our cache package is used as a storage middleware for
       * the Axios cache, allowing us to save API results to disk
       * between two runs of the program in development mode.
       */
      storage: buildStorage({
        async find(key) {
          const value = await diskCache.get<string>(key);
          log(`API cache middleware: looked up '${key}', cache ${value ? 'hit' : 'miss'}.`);

          return value ? JSON.parse(value) : undefined;
        },
        async set(key, value) {
          log(`API cache middleware: setting '${key}'.`);
          await diskCache.set(key, JSON.stringify(value));
        },
        async remove(key) {
          log(`API cache middleware: removing '${key}'.`);
          await diskCache.delete(key);
        },
        async clear() {
          log('API cache middleware: resetting.');
          await diskCache.clear();
        },
      }),
    });
  }

  // TODO: add endpoints to download arbitrary image URLs returned by
  // other endpoints, which account for the need to deduce calls from
  // the rate limit budget.

  /* Proxify every v* API object so we can slow down API calls.
   * We do this without a loop because of TypeScript limitations,
   * so this must be maintained on every major API version release. */
  if (rateLimit) {
    log(`Applying rate limit proxy to API client.`);

    api.instance.interceptors.request.use(async function (config) {
      // If we have cache for the request, no need to consider rate limiting.
      const cacheHit = diskCache && (await diskCache.get<string>(defaultKeyGenerator(config)));

      if (!cacheHit) {
        // Until Figma shed light on their actual rate limit implementation, all
        // requests have the same cost. Wait for the request to be allowed to run
        // to exit the Axios interceptor.
        await interceptRequest(1);
      }

      return config;
    });
  }

  // TODO: add response interceptor for 429 handling.

  log(`Created Figma REST API client successfully.`);

  return api;
}
