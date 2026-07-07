import type { ClientInterface } from '@figmarine/rest';
import { log } from '@figmarine/logger';

import type { Cutting } from './schemas/cutting';
import { printCutting } from './logHelpers';
import { take } from './take';

/**
 * Options for {@link hydrate}.
 */
export type HydrateOptions = {
  /**
   * The `@figmarine/rest` client used to call the Figma REST API.
   */
  client: ClientInterface;

  /**
   * The Cutting to re-hydrate.
   */
  cutting: Cutting;
};

/**
 * Re-hydrates a Cutting: fetches fresh data for every facet the Cutting
 * records, and returns a new Cutting with up-to-date data and hydration
 * timestamps. Storage metadata (label, last stored time and file path)
 * carries over so the refreshed Cutting can be planted back where the
 * original grew.
 *
 * @param options See {@link HydrateOptions}.
 * @returns A freshly hydrated copy of the Cutting.
 */
export async function hydrate({ client, cutting }: HydrateOptions): Promise<Cutting> {
  log(`Cuttings::hydrate: re-hydrating cutting ${printCutting(cutting)}.`);

  const fresh = await take({
    client,
    facets: cutting.facets,
    label: cutting.meta.label,
  });

  return {
    ...fresh,
    meta: {
      ...fresh.meta,
      lastStored: cutting.meta.lastStored,
      lastKnownFilePath: cutting.meta.lastKnownFilePath,
    },
  };
}
