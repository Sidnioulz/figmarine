import { buildStorage, type NotEmptyStorageValue } from 'axios-cache-interceptor';
import type { Cacheable } from 'cacheable';
import { log } from '@figmarine/logger';

const find = (diskCache: Cacheable) => async (key: string) => {
  const value = await diskCache.get<string>(key);
  log(`API cache middleware: looked up '${key}', cache ${value ? 'hit' : 'miss'}.`);

  return value ? JSON.parse(value) : undefined;
};

const set = (diskCache: Cacheable) => async (key: string, value: NotEmptyStorageValue) => {
  log(`API cache middleware: setting '${key}'.`);
  await diskCache.set(key, JSON.stringify(value));
};

const remove = (diskCache: Cacheable) => async (key: string) => {
  log(`API cache middleware: removing '${key}'.`);
  await diskCache.delete(key);
};

const clear = (diskCache: Cacheable) => async () => {
  log('API cache middleware: resetting.');
  await diskCache.clear();
};

/**
 * Translates the axios-cache-interceptor storage API into the one
 * used by @figmarine/cache so we can use our own cache library as
 * storage in Axios.
 * @param diskCache The @figmarine/cache instance.
 * @returns An axios-cache-interceptor compatible storage.
 */
export function storage(diskCache: Cacheable) {
  return buildStorage({
    clear: clear(diskCache),
    find: find(diskCache),
    remove: remove(diskCache),
    set: set(diskCache),
  });
}
