import * as cacheModule from '@figmarine/cache';
import * as loggerModule from '@figmarine/logger';
import { test as base } from 'vitest';
import upstreamMockedEnv from 'mocked-env';
import { vol } from 'memfs';

import * as interceptorsModule from '../interceptors';
import { Client } from '../client';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

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

// TODO mock oas serv and write extra tests

describe('@figmarine/rest - client', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ '/tmp': null });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Options - cache', () => {
    it('create cache in /tmp/@figmarine by default in development mode', async ({ mockedEnv }) => {
      mockedEnv({
        NODE_ENV: 'development',
      });

      await Client();

      const folder = vol.lstatSync('/tmp/@figmarine/cache');

      expect(folder.isDirectory).toBeTruthy();
    });

    it('has no cache by default in production mode', async ({ mockedEnv }) => {
      mockedEnv();
      await Client();

      const hasFolder = vol.existsSync('/tmp/@figmarine/cache');

      expect(hasFolder).toBeFalsy();
    });

    it('does not have cache when false is passed', async ({ mockedEnv }) => {
      mockedEnv({
        NODE_ENV: 'development',
      });

      await Client({ cache: false });

      const hasFolder = vol.existsSync('/tmp/@figmarine/cache');

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
        `/tmp/@figmarine/cache/${location}`,
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
});
