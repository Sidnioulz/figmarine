import fs from 'node:fs';

import { digCutting } from '@figmarine/cuttings';
import { log } from '@figmarine/logger';

import { cuttingPath, DEFAULT_CONFIG_PATH, loadConfig, selectCuttings } from '../config';

/**
 * The freshness report for one configured cutting.
 */
export interface CuttingStatus {
  /**
   * The cutting's name in the config.
   */
  name: string;

  /**
   * The path where the cutting is planted.
   */
  location: string;

  /**
   * Whether a planted cutting exists at that path.
   */
  planted: boolean;

  /**
   * Number of facets recorded in the planted cutting.
   */
  facetCount?: number;

  /**
   * Timestamp of the oldest facet hydration, i.e. the cutting's overall
   * data age. Zero when a facet was never hydrated.
   */
  oldestHydration?: number;

  /**
   * Whether the cutting is missing or older than the given max age.
   */
  stale: boolean;
}

/**
 * Options for {@link status}.
 */
export interface StatusOptions {
  /**
   * Names of the cuttings to inspect. Inspects every configured cutting
   * when empty.
   */
  names?: string[];

  /**
   * Path to the nursery config file.
   */
  configPath?: string;

  /**
   * Age in seconds beyond which a cutting counts as stale. Missing
   * cuttings are always stale.
   */
  maxAgeSeconds?: number;

  /**
   * Clock function, injectable for tests.
   */
  now?: () => number;
}

/**
 * Reports the freshness of the selected cuttings.
 *
 * @param options See {@link StatusOptions}.
 * @returns One report per selected cutting.
 */
export function status({
  names,
  configPath = DEFAULT_CONFIG_PATH,
  maxAgeSeconds,
  now = Date.now,
}: StatusOptions = {}): CuttingStatus[] {
  const config = loadConfig(configPath);
  const selected = selectCuttings(config, names, configPath);

  return selected.map(([name]) => {
    const location = cuttingPath(config, name);

    if (!fs.existsSync(location)) {
      log(`Nursery::status: '${name}' is not planted.`);
      return { name, location, planted: false, stale: true };
    }

    const cutting = digCutting(location);
    const hydrations = cutting.facets.map((f) => f.lastHydrated ?? 0);
    const oldestHydration = hydrations.length ? Math.min(...hydrations) : 0;

    const stale =
      maxAgeSeconds !== undefined
        ? oldestHydration === 0 || now() - oldestHydration > maxAgeSeconds * 1000
        : false;

    return {
      name,
      location,
      planted: true,
      facetCount: cutting.facets.length,
      oldestHydration,
      stale,
    };
  });
}
