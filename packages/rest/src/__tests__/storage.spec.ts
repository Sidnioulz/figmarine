import { test as base } from 'vitest';
import { Cacheable } from 'cacheable';

import { Alternative200, Basic200 } from '../__fixtures__/storage';
import { storage } from '../storage';

/* Local context. */
interface StorageFixtures {
  diskCache: Cacheable;
}
const it = base.extend<StorageFixtures>({
  diskCache: async ({}, use) => {
    // We test against Cacheable because our cache implements that interface.
    // No need to write yet another @figmarine/cache test suite.
    const c = new Cacheable({});
    c.set('existing', JSON.stringify(Basic200));

    await use(c);
  },
});

describe('@figmarine/rest - storage', () => {
  describe('get', () => {
    it("does not get data that's not in cache", async ({ diskCache }) => {
      const built = storage(diskCache);
      const hasFoo = await built.get('foo');
      expect(hasFoo).toMatchObject({ state: 'empty' });
    });

    it("gets data that's in cache", async ({ diskCache }) => {
      const built = storage(diskCache);
      const hasExisting = await built.get('existing');
      expect(hasExisting).toMatchObject(Basic200);
    });
  });

  describe('set', () => {
    it('can set data', async ({ diskCache }) => {
      const built = storage(diskCache);
      expect(await diskCache.has('myCustomKey')).toBeFalsy();

      await built.set('myCustomKey', Basic200);
      expect(await diskCache.has('myCustomKey')).toBeTruthy();
    });

    it('sets the latest passed data on a key', async ({ diskCache }) => {
      const built = storage(diskCache);

      await built.set('myCustomKey', Basic200);
      await built.set('myCustomKey', Alternative200);
      expect(await diskCache.get('myCustomKey')).toBe(JSON.stringify(Alternative200));
    });
  });

  describe('remove', () => {
    it('can remove data', async ({ diskCache }) => {
      const built = storage(diskCache);
      expect(await diskCache.has('existing')).toBeTruthy();

      await built.remove('existing');
      expect(await diskCache.has('existing')).toBeFalsy();
    });
  });

  describe('clear', () => {
    it('can clear data', async ({ diskCache }) => {
      const built = storage(diskCache);

      await built.set('myCustomKey', Basic200);
      await built.clear();

      expect(await diskCache.has('existing')).toBeFalsy();
      expect(await diskCache.has('myCustomKey')).toBeFalsy();
    });
  });
});
