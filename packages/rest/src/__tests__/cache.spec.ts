import { test as base } from 'vitest';

import { Alternative200, Basic200 } from '../__fixtures__/storage';
import { Cache, generatePredictableKey } from '../cache';
import { Cacheable } from 'cacheable';
import { Client } from '../client';

/* Local context. */
interface StorageFixtures {
  cache: Cache;
}
const it = base.extend<StorageFixtures>({
  cache: async ({}, use) => {
    const c = new Cache(await Client({ personalAccessToken: 'foo ' }));
    c.set('existing', Basic200);
    await use(c);
  },
});

describe('@figmarine/rest - cache', () => {
  describe('Cache', () => {
    describe('has', () => {
      it("does not find data that's not in cache", async ({ cache }) => {
        const hasFoo = await cache.has('foo');
        expect(hasFoo).toBeFalsy();
      });

      it("finds data that's in cache", async ({ cache }) => {
        const hasExisting = await cache.has('existing');
        expect(hasExisting).toBeTruthy();
      });
    });

    describe('get', () => {
      it("does not get data that's not in cache", async ({ cache }) => {
        const hasFoo = await cache.get('foo');
        expect(hasFoo).toBeUndefined();
      });

      it("gets data that's in cache", async ({ cache }) => {
        const hasExisting = await cache.get('existing');
        expect(hasExisting).toMatchObject(Basic200);
      });
    });

    describe('set', () => {
      it('can set data', async ({ cache }) => {
        expect(await cache.has('myCustomKey')).toBeFalsy();

        await cache.set('myCustomKey', Basic200);
        expect(await cache.has('myCustomKey')).toBeTruthy();
      });

      it('sets the latest passed data on a key', async ({ cache }) => {
        await cache.set('myCustomKey', Basic200);
        await cache.set('myCustomKey', Alternative200);
        expect(await cache.get('myCustomKey')).toStrictEqual(Alternative200);
      });
    });

    describe('delete', () => {
      it('can delete data', async ({ cache }) => {
        expect(await cache.has('existing')).toBeTruthy();

        await cache.delete('existing');
        expect(await cache.has('existing')).toBeFalsy();
      });
    });

    describe('clear', () => {
      it('can clear data', async ({ cache }) => {
        await cache.set('myCustomKey', Basic200);
        await cache.clear();

        expect(await cache.has('existing')).toBeFalsy();
        expect(await cache.has('myCustomKey')).toBeFalsy();
      });
    });

    describe('getCache', () => {
      it('returns the underlying Cacheable', ({ cache }) => {
        expect(cache.getCache()).toBeInstanceOf(Cacheable);
      });
    });

    describe('iterator', () => {
      it('allows iterating over entries', async ({ cache }) => {
        const iteratorSpy = vitest.spyOn(cache, 'iterator');
        for await (const [key, value] of cache.iterator()) {
          // noop;
          expect(key).toBe('existing');
          expect(value).toBe(JSON.stringify(Basic200));
        }

        expect(iteratorSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('generatePredictableKey', () => {
    it('adds method to the key', () => {
      const method = 'POST';
      expect(generatePredictableKey({ method })).toMatch(new RegExp(`^${method} @ `));
    });

    it('replaces method with GET if missing', () => {
      expect(generatePredictableKey({})).toMatch(/^GET @ /);
    });

    it('adds url to the key', () => {
      const url = '/squirrels/chip';
      expect(generatePredictableKey({ url })).toMatch(new RegExp(`^GET @ ${url} @ `));
    });

    it('replaces url with / if missing', () => {
      expect(generatePredictableKey({})).toMatch(new RegExp(`^GET @ / @ `));
    });

    it('serialises params and adds them to the key', () => {
      const params = { id: 'chip' };
      expect(generatePredictableKey({ params })).toContain(
        `GET @ / @ ${JSON.stringify(params)} @ `,
      );
    });

    it('replaces params with - if missing', () => {
      expect(generatePredictableKey({})).toMatch(new RegExp(`^GET @ / @ - @`));
    });

    it('serialises data and adds them to the key', () => {
      const data = { type: 'chipmunk' };
      expect(generatePredictableKey({ data })).toContain(`GET @ / @ - @ ${JSON.stringify(data)}`);
    });

    it('replaces data with - if missing', () => {
      expect(generatePredictableKey({})).toMatch(new RegExp(`^GET @ / @ - @ -$`));
    });
  });
});
