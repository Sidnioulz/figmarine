import { test as base } from 'vitest';
import { Cacheable } from 'cacheable';
import { defaultKeyGenerator } from 'axios-cache-interceptor';

import * as rateLimitModule from '../rateLimit';
import { Basic200 } from '../__fixtures__/storage';
import { fileRequest } from '../__fixtures__/fileRequest';
import { rateLimitRequestInterceptor } from '../interceptors';

/* Mock diskCache. */
interface StorageFixtures {
  diskCache: Cacheable;
}
const it = base.extend<StorageFixtures>({
  diskCache: async ({}, use) => {
    const c = new Cacheable({});
    c.set('existing', JSON.stringify(Basic200));
    await use(c);
  },
});

describe('@figmarine/rest - interceptors', () => {
  describe('rateLimitRequestInterceptor', () => {
    it('returns a function when called', ({ diskCache }) => {
      const interceptor = rateLimitRequestInterceptor(defaultKeyGenerator, diskCache);
      expect(typeof interceptor).toBe('function');
    });

    it('rate limits requests that do not hit cache', async ({ diskCache }) => {
      const rlSpy = vi.spyOn(rateLimitModule, 'interceptRequest');
      const interceptor = rateLimitRequestInterceptor(defaultKeyGenerator, diskCache);
      await interceptor(fileRequest);
      expect(rlSpy).toHaveBeenCalled();
    });
    it('skip rate limiting for requests that do hit cache', async ({ diskCache }) => {
      const rlSpy = vi.spyOn(rateLimitModule, 'interceptRequest');
      await diskCache.set(defaultKeyGenerator(fileRequest), 'someResponse');
      const interceptor = rateLimitRequestInterceptor(defaultKeyGenerator, diskCache);
      await interceptor(fileRequest);
      expect(rlSpy).not.toHaveBeenCalled();
    });
  });
});
