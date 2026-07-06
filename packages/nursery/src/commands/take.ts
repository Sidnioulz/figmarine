import { plantCutting, take } from '@figmarine/cuttings';
import { log } from '@figmarine/logger';

import { type ClientFactory, defaultClientFactory } from '../client';
import { cuttingPath, DEFAULT_CONFIG_PATH, loadConfig } from '../config';
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
}

/**
 * Selects config entries by name, throwing on unknown names.
 */
export function selectCuttings<T>(cuttings: Record<string, T>, names?: string[]): [string, T][] {
  const all = Object.entries(cuttings);

  if (!names?.length) {
    return all;
  }

  const unknown = names.filter((n) => !(n in cuttings));
  if (unknown.length) {
    throw new Error(`Nursery: no cuttings named: ${unknown.join(', ')}.`);
  }

  return all.filter(([name]) => names.includes(name));
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
}: TakeCommandOptions = {}): Promise<string[]> {
  const config = loadConfig(configPath);
  const selected = selectCuttings(config.cuttings, names);

  if (!selected.length) {
    throw new Error(
      `Nursery::take: no cuttings configured in '${configPath}'. Run 'nursery init <figma url>' first.`,
    );
  }

  const client = await clientFactory();
  const planted: string[] = [];

  for (const [name, entry] of selected) {
    log(`Nursery::take: taking cutting '${name}'.`);

    const cutting = await take({
      client,
      facets: planFacets(entry),
      label: entry.label ?? name,
    });

    const location = cuttingPath(config, name);
    plantCutting(cutting, location);
    planted.push(location);
  }

  return planted;
}
