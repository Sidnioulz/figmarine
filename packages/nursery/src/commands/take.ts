import { plantCutting, take } from '@figmarine/cuttings';
import { log } from '@figmarine/logger';

import { type ClientFactory, defaultClientFactory } from '../client';
import { cuttingPath, DEFAULT_CONFIG_PATH, loadConfig, selectCuttings } from '../config';
import { planFacets } from '../plan';

/**
 * Options for {@link takeCommand}.
 */
export interface TakeCommandOptions {
  /**
   * Names of the cuttings to take. Takes every configured cutting when
   * empty.
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
 * Takes fresh cuttings for the selected config entries and plants them in
 * the configured output directory.
 *
 * @param options See {@link TakeCommandOptions}.
 * @returns The paths of the planted cuttings.
 */
export async function takeCommand({
  names,
  configPath = DEFAULT_CONFIG_PATH,
  clientFactory = defaultClientFactory,
  onProgress,
}: TakeCommandOptions = {}): Promise<string[]> {
  const config = loadConfig(configPath);
  const selected = selectCuttings(config, names, configPath);

  const client = await clientFactory();
  const planted: string[] = [];

  for (const [name, entry] of selected) {
    log(`Nursery::take: taking cutting '${name}'.`);
    const facets = planFacets(entry);
    onProgress?.(`Taking cutting '${name}' (${facets.length} facets)…`);

    const cutting = await take({
      client,
      facets,
      label: entry.label ?? name,
    });

    const location = cuttingPath(config, name);
    plantCutting(cutting, location);
    planted.push(location);
  }

  return planted;
}
