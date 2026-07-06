import fs from 'node:fs';

import { attachCuttings, type Cutting, digCutting } from '@figmarine/cuttings';
import type { ClientInterface } from '@figmarine/rest';
import { log } from '@figmarine/logger';

import { cuttingPath, DEFAULT_CONFIG_PATH, loadConfig, selectCuttings } from './config';

/**
 * Options for {@link connectNursery}.
 */
export interface ConnectNurseryOptions {
  /**
   * Names of the cuttings to connect. Connects every configured cutting
   * when empty.
   */
  names?: string[];

  /**
   * Path to the nursery config file.
   */
  configPath?: string;
}

/**
 * A live connection between a nursery and a REST client.
 */
export interface NurseryConnection {
  /**
   * The cuttings that were attached to the client.
   */
  cuttings: Cutting[];

  /**
   * The paths the attached cuttings were loaded from.
   */
  locations: string[];

  /**
   * Detaches the cuttings from the client, which then behaves as if the
   * nursery was never connected.
   */
  disconnect: () => void;
}

/**
 * Connects a `@figmarine/rest` client to the nursery: loads the planted
 * cuttings named by the nursery config and attaches them to the client,
 * so that compatible API calls are served from planted data instead of
 * the network. Incompatible or uncovered calls keep going to the network.
 *
 * Planted cuttings are authoritative regardless of age — connecting never
 * triggers network calls. Check freshness separately with `status` (its
 * `maxAgeSeconds` option flags stale cuttings) and re-fetch with `refresh`
 * before connecting when your use case needs recent data.
 *
 * @param client The REST client to connect.
 * @param options See {@link ConnectNurseryOptions}.
 * @throws When the config is missing or invalid, when a name is unknown,
 * or when a selected cutting was never planted.
 * @returns See {@link NurseryConnection}.
 */
export function connectNursery(
  client: ClientInterface,
  { names, configPath = DEFAULT_CONFIG_PATH }: ConnectNurseryOptions = {},
): NurseryConnection {
  const config = loadConfig(configPath);
  const selected = selectCuttings(config, names, configPath);

  const cuttings: Cutting[] = [];
  const locations: string[] = [];
  for (const [name] of selected) {
    const location = cuttingPath(config, name);
    if (!fs.existsSync(location)) {
      throw new Error(
        `Nursery::connectNursery: cutting '${name}' is not planted at '${location}'. Run 'nursery take ${name}' first.`,
      );
    }

    cuttings.push(digCutting(location));
    locations.push(location);
  }

  log(`Nursery::connectNursery: connecting ${cuttings.length} planted cuttings to a client.`);
  const disconnect = attachCuttings(client, cuttings);

  return { cuttings, locations, disconnect };
}
