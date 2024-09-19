import path from 'node:path';

import { faker } from '@faker-js/faker';
import { vol } from 'memfs';

import { DEFAULT_CACHE_PATH } from '../constants';
import { makeCache } from '..';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('@figmarine/cache - index', () => {
  describe('makeCache', () => {
    beforeEach(() => {
      vol.reset();
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('uses the passed absolute location if one is passed', async () => {
      const location = '/an/absolute/location';
      const { shutdownGracefully } = makeCache({ location });
      const folder = vol.lstatSync(location);

      expect(folder.isDirectory).toBeTruthy();
      await shutdownGracefully();
    });

    it('writes a relative cache location to the default cache path', async () => {
      const { shutdownGracefully } = makeCache({ location: 'test' });
      const folder = vol.lstatSync(path.join(DEFAULT_CACHE_PATH, 'test'));

      expect(folder.isDirectory).toBeTruthy();
      await shutdownGracefully();
    });

    it("doesn't contain content that was never cached", async () => {
      const { diskCache, shutdownGracefully } = makeCache({
        location: faker.string.alphanumeric(5),
      });
      const neverSet = await diskCache.get('key');

      expect(neverSet).not.toBeDefined();
      await shutdownGracefully();
    });

    it('contains content after it was cached', async () => {
      const { diskCache, shutdownGracefully } = makeCache({
        location: faker.string.alphanumeric(5),
      });
      await diskCache.set('key', 'value');
      const existing = await diskCache.get('key');

      expect(existing).toBe('value');
      await shutdownGracefully();
    });

    it('contains content up until ttl is reached, but not after', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const ttl = 1;
      const { diskCache, shutdownGracefully } = makeCache({
        location: faker.string.alphanumeric(5),
        ttl,
      });

      await diskCache.set('key', 'value');
      expect(await diskCache.get('key')).toBe('value');

      vi.advanceTimersByTime(1000 * (ttl * 2));
      expect(await diskCache.get('key')).not.toBeDefined();

      await shutdownGracefully();
      vi.runAllTimers();
      vi.useRealTimers();
    });

    it('contains content until a cache reset, but not after', async () => {
      const { diskCache, shutdownGracefully } = makeCache({
        location: faker.string.alphanumeric(5),
      });
      await diskCache.set('key', 'value');

      const existing = await diskCache.get('key');
      expect(existing).toBe('value');

      await diskCache.clear();

      const nowGone = await diskCache.get('key');
      expect(nowGone).not.toBeDefined();

      await shutdownGracefully();
    });

    it('contains content across runs', async () => {
      const location = faker.string.alphanumeric(5);
      const c1 = makeCache({ location });
      await c1.diskCache.set('key', 'value');
      await c1.shutdownGracefully();

      const c2 = makeCache({ location });
      expect(await c2.diskCache.get('key')).toBe('value');
      await c2.shutdownGracefully();
    });
  });
});
