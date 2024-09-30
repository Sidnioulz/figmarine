import os from 'node:os';
import path from 'node:path';

import * as cacheModule from '@figmarine/cache';
import * as loggerModule from '@figmarine/logger';
import axios from 'axios';
import { test as base } from 'vitest';
import nock from 'nock';
import upstreamMockedEnv from 'mocked-env';
import { vol } from 'memfs';

import * as interceptorsModule from '../interceptors';
import { Client, ClientInterface } from '../client';
import { Cache } from '../cache';

/* Mock rate limit config. */
const { mockedConfig, mocked429Config } = vi.hoisted(() => {
  return {
    mockedConfig: vi.fn(),
    mocked429Config: vi.fn(),
  };
});

vi.mock(import('../rateLimit.config'), async (importOriginal) => {
  const mod = await importOriginal();

  return {
    ...mod,
    getConfig: mockedConfig,
    get429Config: mocked429Config,
  };
});

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Mock the 1 minute initial delay for 429 retries. We use a shorter delay to avoid timeouts. */
const INITIAL_DELAY = 10;

/* Local context. */
interface ClientFixtures {
  mockedEnv: (args?: typeof process.env) => void;
}
const it = base.extend<ClientFixtures>({
  mockedEnv: async ({}, use) => {
    // Setup.
    let restore: ReturnType<typeof upstreamMockedEnv> | undefined;
    const runMocker: ClientFixtures['mockedEnv'] = (args) => {
      restore = upstreamMockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: 'foo',
        NODE_ENV: 'production',
        ...(args ?? {}),
      });
    };

    // Use.
    await use(runMocker);

    // Cleanup.
    restore?.();
  },
});

const tmpDir = os.tmpdir();

/* Nock helpers. */
const callNockedEndpoint = async (c: ClientInterface) => {
  try {
    const response = await c.v1.getFile('testKey');
    return {
      status: response.status,
      headers: response.headers as Record<string, string>,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        status: error.response.status,
        headers: error.response.headers as Record<string, string>,
      };
    }
    throw error;
  }
};

describe('@figmarine/rest - client', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ [tmpDir]: null });
    mockedConfig.mockReturnValue({
      reqLog: [],
      WINDOW_BUDGET: 10,
      WINDOW_LENGTH: 60,
    });
    mocked429Config.mockReturnValue({ INITIAL_DELAY: 500 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Options - cache', () => {
    it('create cache in /tmp/@figmarine by default in development mode', async ({ mockedEnv }) => {
      mockedEnv({
        NODE_ENV: 'development',
      });
      const c = await Client();

      const folder = vol.lstatSync(path.join(tmpDir, '@figmarine/cache'));

      expect(folder.isDirectory).toBeTruthy();
      expect(c.cacheInstance).toBeInstanceOf(Cache);
    });

    it('has no cache by default in production mode', async ({ mockedEnv }) => {
      mockedEnv();
      const c = await Client();

      const hasFolder = vol.existsSync(path.join(tmpDir, '@figmarine/cache'));

      expect(hasFolder).toBeFalsy();
      expect(c.cacheInstance).toBeUndefined();
    });

    it('does not have cache when false is passed', async ({ mockedEnv }) => {
      mockedEnv({
        NODE_ENV: 'development',
      });

      await Client({ cache: false });

      const hasFolder = vol.existsSync(path.join(tmpDir, '@figmarine/cache'));

      expect(hasFolder).toBeFalsy();
    });

    it('uses the passed absolute location if one is passed', async ({ mockedEnv }) => {
      mockedEnv();
      const location = '/some/arbitrary/location';
      await Client({ cache: { location } });

      const hasFolder = vol.existsSync(location);

      expect(hasFolder).toBeTruthy();
    });

    it('writes a relative cache location to /tmp/@figmarine/cache', async ({ mockedEnv }) => {
      mockedEnv();
      const location = 'my-cool-web-app';
      await Client({ cache: { location } });

      const hasFolderRelativeToCwd = vol.existsSync(location);
      const hasFolderRelativeToDefaultLocation = vol.existsSync(
        path.join(tmpDir, `@figmarine/cache/${location}`),
      );

      expect(hasFolderRelativeToCwd).toBeFalsy();
      expect(hasFolderRelativeToDefaultLocation).toBeTruthy();
    });

    it('passes all `cache` options to the cache constructor', async ({ mockedEnv }) => {
      const spy = vi.spyOn(cacheModule, 'makeCache');

      mockedEnv();
      const cacheOpts = {
        location: 'my-cool-web-app',
        ttl: 200,
      };
      await Client({ cache: cacheOpts });

      expect(spy).toHaveBeenCalledWith(cacheOpts);
    });
  });

  describe('Options - mode', () => {
    it('defaults to process.env.NODE_ENV', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv();
      await Client();
      expect(spy).toHaveBeenCalledWith('Creating client in production mode.');
    });

    it('accepts development', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv();
      await Client({ mode: 'development' });
      expect(spy).toHaveBeenCalledWith('Creating client in development mode.');
    });

    it('accepts production', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv();
      await Client({ mode: 'production' });
      expect(spy).toHaveBeenCalledWith('Creating client in production mode.');
    });
  });

  describe('Options - auth', () => {
    it('successfully stores a personal access token for request auth', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: undefined,
        FIGMA_OAUTH_TOKEN: undefined,
      });
      await Client({ personalAccessToken: 'foo' });
      expect(spy).toHaveBeenCalledWith(
        'Creating Figma REST client with personal access token (set programmatically)',
      );
    });

    it('successfully stores an OAuth token for request auth', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: undefined,
        FIGMA_OAUTH_TOKEN: undefined,
      });
      await Client({ oauthToken: 'foo' });
      expect(spy).toHaveBeenCalledWith(
        'Creating Figma REST client with OAuth token (set programmatically)',
      );
    });

    it('prefers the OAuth token when both are passed', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: undefined,
        FIGMA_OAUTH_TOKEN: undefined,
      });
      await Client({ oauthToken: 'foo', personalAccessToken: 'bar' });
      expect(spy).toHaveBeenCalledWith(
        'Creating Figma REST client with OAuth token (set programmatically)',
      );
    });

    it('successfully stores a personal access token passed through process.env', async ({
      mockedEnv,
    }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: 'foo',
        FIGMA_OAUTH_TOKEN: undefined,
      });
      await Client();
      expect(spy).toHaveBeenCalledWith(
        'Creating Figma REST client with personal access token (from env)',
      );
    });

    it('successfully stores an OAuth token  passed through process.env', async ({ mockedEnv }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: undefined,
        FIGMA_OAUTH_TOKEN: 'foo',
      });
      await Client();
      expect(spy).toHaveBeenCalledWith('Creating Figma REST client with OAuth token (from env)');
    });

    it('prefers a personal access token passed through options than through process.env', async ({
      mockedEnv,
    }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: 'foo',
        FIGMA_OAUTH_TOKEN: undefined,
      });
      await Client({ personalAccessToken: 'bar' });
      expect(spy).toHaveBeenCalledWith(
        'Creating Figma REST client with personal access token (set programmatically)',
      );
    });

    it('prefers an OAuth token passed through options than through process.env', async ({
      mockedEnv,
    }) => {
      const spy = vi.spyOn(loggerModule, 'log');
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: undefined,
        FIGMA_OAUTH_TOKEN: 'foo',
      });
      await Client({ oauthToken: 'bar' });
      expect(spy).toHaveBeenCalledWith(
        'Creating Figma REST client with OAuth token (set programmatically)',
      );
    });

    it.todo(
      'gives a clear error message when an invalid personalAccessToken is passed',
      // async ({ mockedEnv }) => {},
    );
    it.todo(
      'gives a clear error message when an invalid oauthToken is passed',
      // async ({ mockedEnv }) => {},
    );

    it('fails to run when neither token is passed', async ({ mockedEnv }) => {
      mockedEnv({
        FIGMA_PERSONAL_ACCESS_TOKEN: undefined,
        FIGMA_OAUTH_TOKEN: undefined,
      });
      expect(Client).rejects.toThrow(
        'You must set the environment variable FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_OAUTH_TOKEN',
      );
    });
  });

  describe('Options - rateLimit', () => {
    it('rate limits by default', async ({ mockedEnv }) => {
      const logSpy = vi.spyOn(loggerModule, 'log');
      const rlSpy = vi.spyOn(interceptorsModule, 'rateLimitRequestInterceptor');
      mockedEnv({});
      await Client();
      expect(logSpy).toHaveBeenCalledWith('Applying rate limit proxy to API client.');
      expect(rlSpy).toHaveBeenCalled();
    });

    it('does not rate limit when false', async ({ mockedEnv }) => {
      const logSpy = vi.spyOn(loggerModule, 'log');
      const rlSpy = vi.spyOn(interceptorsModule, 'rateLimitRequestInterceptor');
      mockedEnv({});
      await Client({ rateLimit: false });
      expect(logSpy).not.toHaveBeenCalledWith('Applying rate limit proxy to API client.');
      expect(rlSpy).not.toHaveBeenCalled();
    });

    it('does rate limit when true', async ({ mockedEnv }) => {
      const logSpy = vi.spyOn(loggerModule, 'log');
      const rlSpy = vi.spyOn(interceptorsModule, 'rateLimitRequestInterceptor');
      mockedEnv({});
      await Client({ rateLimit: true });
      expect(logSpy).toHaveBeenCalledWith('Applying rate limit proxy to API client.');
      expect(rlSpy).toHaveBeenCalled();
    });
  });

  describe('Environment - FIGMA_API_BASE_URL', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('allows customising the default URL for integration testing', async ({ mockedEnv }) => {
      mockedEnv({ FIGMA_API_BASE_URL: 'https://localhost:4010' });
      const c = await Client({ rateLimit: true });
      const originalScole = nock('https://api.figma.com').get('/v1/files/testKey').reply(200, 'OK');
      const modifiedUrlScope = nock('https://localhost:4010')
        .get('/v1/files/testKey')
        .reply(200, 'OK');

      const response = await callNockedEndpoint(c);

      expect(response.status).toBe(200);
      expect(originalScole.isDone()).toBe(false);
      expect(originalScole.activeMocks()).toHaveLength(1);
      expect(modifiedUrlScope.isDone()).toBe(true);
      expect(modifiedUrlScope.activeMocks()).toHaveLength(0);
    });
  });

  describe('Auto Retry - 429', () => {
    beforeEach(() => {
      mocked429Config.mockReturnValue({ INITIAL_DELAY });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('retries 429 errors but not other errors', async ({ mockedEnv }) => {
      mockedEnv();

      const c = await Client({ rateLimit: true });
      const scope = nock('https://api.figma.com').get('/v1/files/testKey').reply(403, 'Forbidden');

      const response = await callNockedEndpoint(c);

      expect(response.status).toBe(403);
      expect(scope.isDone()).toBe(true);
      expect(scope.activeMocks()).toHaveLength(0);
    });

    it.for([1, 2, 3, 4, 5])(
      'retries %i minute(s) after equally many 429 errors without Retry-After',
      async (numberOf429, { mockedEnv }) => {
        mockedEnv();

        const requestTimes: number[] = [];
        let requestCount = 0;

        const c = await Client({ rateLimit: true });
        const scope = nock('https://api.figma.com');
        for (let i = 0; i < numberOf429; i++) {
          scope.get('/v1/files/testKey').reply(429, 'Too Many Requests');
        }
        scope.get('/v1/files/testKey').reply(200, 'OK');

        scope.on('request', () => {
          requestTimes.push(Date.now());
          requestCount++;
        });

        const response = await callNockedEndpoint(c);

        expect(response.status).toBe(200);
        expect(scope.isDone()).toBe(true);
        expect(scope.activeMocks()).toHaveLength(0);
        expect(requestCount).toBe(numberOf429 + 1);

        const totalDelay = requestTimes[requestTimes.length - 1] - requestTimes[0];
        const expectedMinDelay = INITIAL_DELAY * (Math.pow(2, numberOf429 + 1) - 2);
        // We know that axios-retry returns between 1 and 1.2 times the computed delay.
        // We take that delay and add a 100ms buffer for JS operations.
        const expectedMaxDelay = 1.2 * expectedMinDelay + 100;

        expect(totalDelay).toBeGreaterThanOrEqual(expectedMinDelay);
        expect(totalDelay).toBeLessThanOrEqual(expectedMaxDelay);
      },
    );

    it('fails on the 7th consecutive retry', async ({ mockedEnv }) => {
      mockedEnv();
      let requestCount = 0;
      const c = await Client({ rateLimit: true });

      const scope = nock('https://api.figma.com')
        .get('/v1/files/testKey')
        .reply(429, 'Too Many Requests')
        .persist();

      scope.on('request', () => {
        requestCount++;
      });

      const response = await callNockedEndpoint(c);

      expect(response.status).toBe(429);
      expect(scope.isDone()).toBe(true);
      expect(scope.activeMocks()).toHaveLength(1);
      expect(requestCount).toBe(7);
    });

    it('respects the Retry-After header delay if higher than our computed delay', async ({
      mockedEnv,
    }) => {
      mockedEnv();
      const headerDelay = 200;
      const startTime = Date.now();
      let endTime = 0;

      const c = await Client({ rateLimit: true });

      const scope = nock('https://api.figma.com')
        .get('/v1/files/testKey')
        .reply(429, 'Too Many Requests', { 'Retry-After': `${headerDelay / 1000}` })
        .get('/v1/files/testKey')
        .reply(200, 'OK');

      scope.on('replied', (req) => {
        if (req.response.statusCode === 200) {
          endTime = Date.now();
        }
      });

      const response = await callNockedEndpoint(c);

      expect(response.status).toBe(200);
      expect(scope.isDone()).toBe(true);
      expect(scope.activeMocks()).toHaveLength(0);

      const totalDelay = endTime - startTime;
      expect(totalDelay).toBeGreaterThanOrEqual(headerDelay);
    });
  });
});
