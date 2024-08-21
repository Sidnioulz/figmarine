import { diskCache } from '@figma-variable-bandaids/cache'
import { log } from '@figma-variable-bandaids/logger'
import { buildStorage, setupCache } from 'axios-cache-interceptor';

import { Api, type Api as ApiInterface } from './__generated__/figmaRestApi';

export interface ClientOptions {
  oauthToken?: string
  personalAccessToken?: string
}

export type ClientInterface = Omit<ApiInterface<ClientOptions>, 'setSecurityData'>

export async function Client(opts: ClientOptions = {}): Promise<ClientInterface> {
  const {
    personalAccessToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
    oauthToken =  process.env.FIGMA_OAUTH_TOKEN,
  } = opts

  if (!personalAccessToken && !oauthToken) {
    log('Cannot authenticate to client, no token passed')
    throw new Error("You must set the environment variable FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_OAUTH_TOKEN, or pass `personalAccessToken` or `oauthToken` to this function.")
  }

  if (oauthToken) {
    log(`Creating Figma REST client with OAuth token (${opts.oauthToken ? 'set programmatically' : 'from env'})`)
  } else {
    log(`Creating Figma REST client with personal access token (${opts.personalAccessToken ? 'set programmatically' : 'from env'})`)
  }

  const api = new Api<ClientOptions>({
    securityWorker: (securityData) => {
      if (!securityData) {
        return ;
      }

      const headers = {}
      if (personalAccessToken) {
        headers['X-Figma-Token'] = securityData.personalAccessToken
      }
      if (oauthToken) {
        headers['Authorization'] = `Bearer ${securityData.oauthToken}`
      }

      return { headers }
    },
  });

  api.setSecurityData({
    oauthToken,
    personalAccessToken,
  })

  log(`Setting up cache interceptor on Axios client.`)
  setupCache(api.instance, {
    /**
     * Ignore "don't cache" headers from Figma by default.
     * Let the cache package handle TTL for us, and cache
     * invalidation logic clear stale cache.
     * @returns {number} A 999999999999 seconds TTL.
     */
    headerInterpreter: () => 999999999999,

    /**
     * 
     */
    storage: buildStorage({
      async find(key) {
        const value = await diskCache.get<string>(key);

        return value ? JSON.parse(value) : undefined
      },
      async set(key, value) {
        await diskCache.set(key, JSON.stringify(value));
      },
      async remove(key) {
        await diskCache.del(key);
      }
    })
  });

  log(`Created Figma REST API client successfully.`)

  return api
}