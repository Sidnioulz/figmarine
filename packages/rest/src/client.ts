import { makeCache, type MakeCacheOptions } from '@figmarine/cache';
import { log } from '@figmarine/logger';
import { buildStorage, setupCache } from 'axios-cache-interceptor';

import { Api, type Api as ApiInterface } from './__generated__/figmaRestApi';

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
   *
   * @type {string}
   */
  personalAccessToken?: string;
}

export type ClientInterface = Omit<ApiInterface<ClientOptions>, 'setSecurityData'>;

export async function Client(opts: ClientOptions = {}): Promise<ClientInterface> {
  const {
    cache = undefined,
    mode = process.env.NODE_ENV,
    personalAccessToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
    oauthToken = process.env.FIGMA_OAUTH_TOKEN,
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

      const headers = {};
      if (personalAccessToken) {
        // FIXME
        // @ts-expect-error will debug asap
        headers['X-Figma-Token'] = securityData.personalAccessToken;
      }
      if (oauthToken) {
        // FIXME
        // @ts-expect-error will debug asap
        headers['Authorization'] = `Bearer ${securityData.oauthToken}`;
      }

      return { headers };
    },
  });

  api.setSecurityData({
    oauthToken,
    personalAccessToken,
  });

  if ((isDevelopment && cache !== false) || cache) {
    if (isDevelopment) {
      log(`Development mode: enabling API cache by default.`);
    } else {
      log(`Cache options passed: enabling API cache.`);
    }
    const { diskCache } = makeCache({ location: 'rest', ttl: -1, ...(cache ?? {}) });

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
          log(`Cache: looked up '${key}', cache ${value ? 'hit' : 'miss'}.`);

          return value ? JSON.parse(value) : undefined;
        },
        async set(key, value) {
          log(`Cache: setting '${key}'.`);
          await diskCache.set(key, JSON.stringify(value));
        },
        async remove(key) {
          log(`Cache: removing '${key}'.`);
          await diskCache.del(key);
        },
      }),
    });
  }

  log(`Created Figma REST API client successfully.`);

  return api;
}
