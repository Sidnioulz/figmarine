import fs from 'node:fs';

import { IMPLEMENTED_ENDPOINT_TYPES, parseFigmaUrl } from '@figmarine/cuttings';
import { log } from '@figmarine/logger';

import { DEFAULT_CONFIG_PATH, loadConfig, type NurseryConfig, saveConfig } from '../config';

/**
 * Options for {@link init}.
 */
export interface InitOptions {
  /**
   * Figma file URLs to snapshot in the new cutting.
   */
  urls: string[];

  /**
   * Name of the cutting in the config. Derived from the first URL's file
   * name when omitted.
   */
  name?: string;

  /**
   * Path to the nursery config file.
   */
  configPath?: string;
}

function deriveName(url: string): string {
  const ref = parseFigmaUrl(url);
  const base = ref.name ?? ref.fileKey;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates or extends the nursery config with a cutting entry for the
 * given Figma URLs.
 *
 * @param options See {@link InitOptions}.
 * @returns The name of the created cutting entry.
 */
export function init({ urls, name, configPath = DEFAULT_CONFIG_PATH }: InitOptions): string {
  if (!urls.length) {
    throw new Error('Nursery::init: pass at least one Figma file URL.');
  }

  // Validate all URLs upfront so a bad one does not half-write the config.
  for (const url of urls) {
    parseFigmaUrl(url);
  }

  const entryName = name ?? deriveName(urls[0]);

  let config: NurseryConfig;
  if (fs.existsSync(configPath)) {
    config = loadConfig(configPath);
  } else {
    log(`Nursery::init: creating new config at '${configPath}'.`);
    config = { cuttings: {} };
  }

  if (config.cuttings[entryName]) {
    throw new Error(
      `Nursery::init: a cutting named '${entryName}' already exists in '${configPath}'. Pass --name to pick another name.`,
    );
  }

  config.cuttings[entryName] = {
    files: urls.map((url) => ({
      url,
      endpoints: [...IMPLEMENTED_ENDPOINT_TYPES],
    })) as NurseryConfig['cuttings'][string]['files'],
  };

  saveConfig(config, configPath);
  log(`Nursery::init: added cutting '${entryName}' with ${urls.length} files.`);

  return entryName;
}
