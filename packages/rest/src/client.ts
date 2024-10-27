import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';
import { log } from '@figmarine/logger';

import { Api, type Api as ApiInterface } from './__generated__/figmaRestApi';
import { Cache, type ClientCacheOptions } from './cache';
import {
  cacheInvalidationRequestInterceptor,
  rateLimitRequestInterceptor,
  userAgentRequestInterceptor,
} from './interceptors';
import { get429Config } from './rateLimit.config';
import { securityWorker } from './securityWorker';

export interface ClientOptions {
  /**
   * Cache options. If set to a truthy value, the cache is always enabled.
   * If set to `false`, the cache is always disabled.
   * @see https://github.com/Sidnioulz/figmarine/blob/main/packages/cache/README.md
   * @type {object | boolean}
   */
  cache?: boolean | (ClientCacheOptions & { autoInvalidate?: boolean });
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
  rateLimit?: boolean | 'reactive' | 'proactive';
}

export type ClientInterface = Omit<ApiInterface<ClientOptions>, 'setSecurityData'> & {
  cacheInstance?: Cache;
};

export async function Client(opts: ClientOptions = {}): Promise<ClientInterface> {
  const {
    cache = undefined,
    mode = process.env.NODE_ENV,
    oauthToken = process.env.FIGMA_OAUTH_TOKEN,
    personalAccessToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
    rateLimit = 'reactive',
  } = opts;

  const isDevelopment = mode === 'development';
  log(`Creating client in ${mode} mode.`);

  if (!personalAccessToken && !oauthToken) {
    log('Cannot authenticate to client, no token passed.');
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

  const api = new Api<ClientOptions>({ securityWorker });
  api.setSecurityData({
    oauthToken,
    personalAccessToken,
  });

  let cacheInstance: Cache | undefined = undefined;
  if ((isDevelopment && cache !== false) || cache) {
    if (isDevelopment) {
      log(`Development mode: enabling API cache by default.`);
    } else {
      log(`Cache options passed: enabling API cache.`);
    }

    const autoInvalidate = typeof cache === 'object' ? (cache?.autoInvalidate ?? true) : true;
    cacheInstance = new Cache(api, typeof cache === 'object' ? cache : undefined);

    if (autoInvalidate) {
      log(`Enabling automatic cache invalidation.`);
      api.instance.interceptors.request.use(cacheInvalidationRequestInterceptor(cacheInstance));
    }
  }

  /* Support changing the base URL so this package can be tested
   * against a mock server. */
  if (process.env.FIGMA_API_BASE_URL) {
    api.instance.defaults.baseURL = process.env.FIGMA_API_BASE_URL;
  }

  // TODO: add endpoints to download arbitrary image URLs returned by
  // other endpoints, which account for the need to deduce calls from
  // the rate limit budget.

  /* Proxify every v* API object so we can slow down API calls.
   * We do this without a loop because of TypeScript limitations,
   * so this must be maintained on every major API version release. */
  if (rateLimit) {
    log('Applying rate limit safeguards to API client.');

    if (rateLimit === true || rateLimit === 'proactive') {
      log('Applying proactive rate limit (limiting req/s).');
      api.instance.interceptors.request.use(rateLimitRequestInterceptor(cacheInstance));
    }

    // Add response interceptor for 429 handling.
    log('Applying exponential retry on Error 429.');
    const rlConfig = get429Config();
    axiosRetry(api.instance, {
      onMaxRetryTimesExceeded: (error) => {
        log(
          `Client: 429 Too Many Requests on '${error.request.url}'. Aborting after too many retries.`,
        );
      },
      onRetry: (retryCount, _, requestConfig) => {
        log(
          `Client: 429 Too Many Requests on '${requestConfig.url}'. Will retry automatically in ${2 ** retryCount / 2} seconds.`,
        );
      },
      retries: 6,
      retryCondition: (error) =>
        isNetworkOrIdempotentRequestError(error) ||
        error.status === 429 ||
        error.response?.status === 429,
      retryDelay: (retryCount, error) =>
        exponentialDelay(retryCount, error, rlConfig.INITIAL_DELAY),
    });
  }

  /* Add User-Agent header to all requests. */
  api.instance.interceptors.request.use(userAgentRequestInterceptor());

  log(`Created Figma REST API client successfully.`);

  return {
    ...api,
    cacheInstance,
  };
}
