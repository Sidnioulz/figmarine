import { test as base } from 'vitest';
import { defaultKeyGenerator } from 'axios-cache-interceptor';

import * as rateLimitModule from '../rateLimit';
import { Basic200 } from '../__fixtures__/storage';
import { Cache } from '../cache';
import { Client } from '../client';
import { fileRequest } from '../__fixtures__/fileRequest';
import { rateLimitRequestInterceptor } from '../interceptors';

/* Mock cache. */
interface StorageFixtures {
  cache: Cache;
}
const it = base.extend<StorageFixtures>({
  cache: async ({}, use) => {
    const c = new Cache(await Client({ personalAccessToken: 'foo' }));
    c.set('existing', Basic200);
    await use(c);
  },
});

describe('@figmarine/rest - interceptors', () => {
  describe('rateLimitRequestInterceptor', () => {
    it('returns a function when called', ({ cache }) => {
      const interceptor = rateLimitRequestInterceptor(defaultKeyGenerator, cache);
      expect(typeof interceptor).toBe('function');
    });

    it('rate limits requests that do not hit cache', async ({ cache }) => {
      const rlSpy = vi.spyOn(rateLimitModule, 'interceptRequest');
      const interceptor = rateLimitRequestInterceptor(defaultKeyGenerator, cache);
      await interceptor(fileRequest);
      expect(rlSpy).toHaveBeenCalled();
    });
    it('skip rate limiting for requests that do hit cache', async ({ cache }) => {
      const rlSpy = vi.spyOn(rateLimitModule, 'interceptRequest');
      await cache.set(defaultKeyGenerator(fileRequest), Basic200);
      const interceptor = rateLimitRequestInterceptor(defaultKeyGenerator, cache);
      await interceptor(fileRequest);
      expect(rlSpy).not.toHaveBeenCalled();
    });
  });
});
