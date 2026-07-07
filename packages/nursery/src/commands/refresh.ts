import fs from 'node:fs';

import { digCutting, hydrate, plantCutting, take } from '@figmarine/cuttings';
import { log } from '@figmarine/logger';

import { type ClientFactory, defaultClientFactory } from '../client';
import { cuttingPath, DEFAULT_CONFIG_PATH, loadConfig, selectCuttings } from '../config';
import { facetsMatch, planFacets } from '../plan';

/**
 * Options for {@link refresh}.
 */
export interface RefreshOptions {
  /**
   * Names of the cuttings to refresh. Refreshes every configured cutting
   * when empty.
   */
  names?: string[];

  /**
   * Path to the nursery config file.
   */
  configPath?: string;

  /**
   * Factory for the REST client. Exposed for testing.
   */
  clientFactory?: ClientFactory;

  /**
   * Called with human-readable progress messages as work proceeds.
   */
  onProgress?: (message: string) => void;
}

/**
 * Refreshes the selected cuttings: re-hydrates planted cuttings from
 * their recorded facets, or takes them from scratch when they were never
 * planted or their config changed since they were.
 *
 * @param options See {@link RefreshOptions}.
 * @returns The paths of the refreshed cuttings.
 */
export async function refresh({
  names,
  configPath = DEFAULT_CONFIG_PATH,
  clientFactory = defaultClientFactory,
  onProgress,
}: RefreshOptions = {}): Promise<string[]> {
  const config = loadConfig(configPath);
  const selected = selectCuttings(config, names, configPath);

  const client = await clientFactory();
  const planted: string[] = [];

  for (const [name, entry] of selected) {
    const location = cuttingPath(config, name);
    const facets = planFacets(entry);

    let cutting;
    if (!fs.existsSync(location)) {
      log(`Nursery::refresh: '${name}' was never planted, taking it.`);
      onProgress?.(`Taking cutting '${name}' (${facets.length} facets)…`);
      cutting = await take({ client, facets, label: entry.label ?? name });
    } else {
      const stored = digCutting(location);

      if (facetsMatch(facets, stored.facets)) {
        log(`Nursery::refresh: re-hydrating '${name}'.`);
        onProgress?.(`Re-hydrating cutting '${name}' (${facets.length} facets)…`);
        cutting = await hydrate({ client, cutting: stored });
      } else {
        log(`Nursery::refresh: config for '${name}' changed, taking it again.`);
        onProgress?.(`Config for '${name}' changed, taking it again (${facets.length} facets)…`);
        cutting = await take({ client, facets, label: entry.label ?? name });
      }
    }

    plantCutting(cutting, location);
    planted.push(location);
  }

  return planted;
}
