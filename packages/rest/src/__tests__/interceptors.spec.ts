import os from 'node:os';

import type { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';
import { test as base } from 'vitest';
import { faker } from '@faker-js/faker';
import { vol } from 'memfs';

import * as rateLimitModule from '../rateLimit';
import { Cache, generatePredictableKey } from '../cache';
import { cacheInvalidationRequestInterceptor, rateLimitRequestInterceptor } from '../interceptors';
import { Basic200 } from '../__fixtures__/storage';
import { Client } from '../client';
import { fileRequest } from '../__fixtures__/fileRequest';
import { getConfig } from '../rateLimit.config';

/* Mock rate limit config. */
const { mockedConfig } = vi.hoisted(() => {
  return {
    mockedConfig: vi.fn(),
  };
});

vi.mock(import('../rateLimit.config'), async (importOriginal) => {
  const mod = await importOriginal();

  return {
    ...mod,
    getConfig: mockedConfig,
  };
});

/* Mock cache. */
interface StorageFixtures {
  cache: Cache;
}
const it = base.extend<StorageFixtures>({
  cache: async ({}, use) => {
    const c = (
      await Client({
        cache: { location: faker.string.alphanumeric(20) },
        personalAccessToken: 'foo',
      })
    ).cacheInstance;

    if (!c) {
      throw new Error('Failed to initialise test fixture.');
    }

    c.set('existing', Basic200);
    await use(c);
  },
});

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

const tmpDir = os.tmpdir();

describe('@figmarine/rest - interceptors', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ [tmpDir]: null });
    mockedConfig.mockReturnValue({
      reqLog: [],
      WINDOW_BUDGET: 10,
      WINDOW_LENGTH: 60,
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cacheInvalidationRequestInterceptor', () => {
    it('returns a function when called', ({ cache }) => {
      const interceptor = cacheInvalidationRequestInterceptor(cache);
      expect(typeof interceptor).toBe('function');
    });

    it('clears cache for non-GET requests', async ({ cache }) => {
      const clearSpy = vi.spyOn(cache, 'clear');
      const interceptor = cacheInvalidationRequestInterceptor(cache);
      const config: InternalAxiosRequestConfig = {
        method: 'POST',
        url: 'https://api.figma.com/v1/files/123',
        headers: {} as AxiosRequestHeaders,
      };
      await interceptor(config);
      expect(clearSpy).toHaveBeenCalled();
    });

    it('does not clear cache for requests without a method (assumes GET)', async ({ cache }) => {
      const clearSpy = vi.spyOn(cache, 'clear');
      const interceptor = cacheInvalidationRequestInterceptor(cache);
      const config: InternalAxiosRequestConfig = {
        url: 'https://api.figma.com/v1/files/123',
        headers: {} as AxiosRequestHeaders,
      };
      await interceptor(config);
      expect(clearSpy).not.toHaveBeenCalled();
    });

    it('does not clear cache for GET requests', async ({ cache }) => {
      const clearSpy = vi.spyOn(cache, 'clear');
      const interceptor = cacheInvalidationRequestInterceptor(cache);
      const config: InternalAxiosRequestConfig = {
        method: 'GET',
        url: 'https://api.figma.com/v1/files/123',
        headers: {} as AxiosRequestHeaders,
      };
      await interceptor(config);
      expect(clearSpy).not.toHaveBeenCalled();
    });

    it('returns the config object unchanged', async ({ cache }) => {
      const interceptor = cacheInvalidationRequestInterceptor(cache);
      const config: InternalAxiosRequestConfig = {
        method: 'POST',
        url: 'https://api.figma.com/v1/files/123',
        headers: {} as AxiosRequestHeaders,
      };
      const result = await interceptor(config);
      expect(result).toBe(config);
    });
  });

  describe('rateLimitRequestInterceptor', () => {
    it('returns a function when called', ({ cache }) => {
      const interceptor = rateLimitRequestInterceptor(cache);
      expect(typeof interceptor).toBe('function');
    });

    it('rate limits requests that do not hit cache', async ({ cache }) => {
      const rlSpy = vi.spyOn(rateLimitModule, 'interceptRequest');
      const cfg = getConfig();

      const interceptor = rateLimitRequestInterceptor(cache);
      await interceptor(fileRequest);
      expect(rlSpy).toHaveBeenCalled();
      expect(cfg.reqLog).toHaveLength(1);
    });

    it('skip rate limiting for requests that do hit cache', async ({ cache }) => {
      const rlSpy = vi.spyOn(rateLimitModule, 'interceptRequest');
      const cfg = getConfig();

      await cache.set(generatePredictableKey(fileRequest), Basic200);
      const interceptor = rateLimitRequestInterceptor(cache);
      await interceptor(fileRequest);
      expect(rlSpy).not.toHaveBeenCalled();
      expect(cfg.reqLog).toHaveLength(0);
    });
  });
});
