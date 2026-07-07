import fs from 'node:fs';
import path from 'node:path';

import { IMPLEMENTED_ENDPOINT_TYPES, printZodError } from '@figmarine/cuttings';
import { log } from '@figmarine/logger';
import { z } from 'zod';

/**
 * Directory where Figmarine keeps its committed state in a consumer
 * repository.
 */
export const FIGMARINE_DIR = '.figmarine';

/**
 * Default location of the nursery configuration file, relative to the
 * repository root.
 */
export const DEFAULT_CONFIG_PATH = path.join(FIGMARINE_DIR, 'nursery.json');

/**
 * Default directory where cuttings grow, relative to the directory that
 * contains the config file.
 */
export const DEFAULT_OUTPUT_DIR = 'cuttings';

/**
 * A Figma file watched by a cutting: its URL, the file-scoped endpoints
 * to fetch for it, and optionally a pinned file version.
 */
export const NurseryFileSchema = z.object({
  url: z.string(),
  endpoints: z
    .array(z.enum(IMPLEMENTED_ENDPOINT_TYPES))
    .nonempty()
    .default([...IMPLEMENTED_ENDPOINT_TYPES]),
  version: z.string().optional(),
});

/**
 * A named cutting: a label for humans, and the Figma files it snapshots.
 */
export const NurseryCuttingSchema = z.object({
  label: z.string().optional(),
  files: z.array(NurseryFileSchema).nonempty(),
});

/**
 * The nursery configuration file format, stored at
 * `.figmarine/nursery.json` by default. A relative `output` is resolved
 * against the directory containing the config file.
 */
export const NurseryConfigSchema = z.object({
  $schema: z.string().optional(),
  output: z.string().default(DEFAULT_OUTPUT_DIR),
  cuttings: z.record(z.string(), NurseryCuttingSchema),
});

export type NurseryFile = z.input<typeof NurseryFileSchema>;
export type NurseryCutting = z.input<typeof NurseryCuttingSchema>;
export type NurseryConfig = z.input<typeof NurseryConfigSchema>;
export type ResolvedNurseryCutting = z.output<typeof NurseryCuttingSchema>;
export type ResolvedNurseryConfig = z.output<typeof NurseryConfigSchema>;

/**
 * Loads and validates the nursery config file. The `output` directory of
 * the returned config is resolved against the config file's directory, so
 * that `--config` invocations from anywhere in a repository agree on where
 * cuttings are planted.
 *
 * @param configPath Path to the config file.
 * @throws When the file is missing, unreadable or invalid.
 * @returns The parsed config, with defaults applied and output resolved.
 */
export function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): ResolvedNurseryConfig {
  log(`Nursery::loadConfig: loading '${configPath}'.`);

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Nursery::loadConfig: no config found at '${configPath}'. Run 'nursery init <figma url>' to create one.`,
    );
  }

  let blob: unknown;
  try {
    blob = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    throw new Error(
      `Nursery::loadConfig: could not parse '${configPath}': ${e instanceof Error ? e.message : e}`,
    );
  }

  const outcome = NurseryConfigSchema.safeParse(blob);
  if (!outcome.success) {
    throw new Error(
      `Nursery::loadConfig: invalid config at '${configPath}':\n${printZodError(outcome.error)}`,
    );
  }

  const config = outcome.data;
  if (!path.isAbsolute(config.output)) {
    config.output = path.join(path.dirname(configPath), config.output);
  }

  log(`Nursery::loadConfig: found ${Object.keys(config.cuttings).length} cuttings.`);

  return config;
}

/**
 * Saves the nursery config file, pretty-printed for reviewable diffs.
 * @param config The config to save.
 * @param configPath Path to the config file.
 */
export function saveConfig(config: NurseryConfig, configPath: string = DEFAULT_CONFIG_PATH): void {
  log(`Nursery::saveConfig: saving '${configPath}'.`);

  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
}

/**
 * Returns the path where a named cutting is planted.
 * @param config The resolved nursery config.
 * @param name The cutting's name in the config.
 * @returns The cutting's file path.
 */
export function cuttingPath(config: ResolvedNurseryConfig, name: string): string {
  return path.join(config.output, `${name}.cutting.figmarine.json`);
}

/**
 * Selects config entries by name. Throws on unknown names, and when the
 * config has no cuttings at all — every command needs at least one.
 *
 * @param config The resolved nursery config.
 * @param names The names to select; selects everything when empty.
 * @param configPath The config path, for error messages.
 * @returns The selected [name, cutting] entries.
 */
export function selectCuttings(
  config: ResolvedNurseryConfig,
  names: string[] | undefined,
  configPath: string,
): [string, ResolvedNurseryCutting][] {
  const all = Object.entries(config.cuttings);

  if (!all.length) {
    throw new Error(
      `Nursery: no cuttings configured in '${configPath}'. Run 'nursery init <figma url>' first.`,
    );
  }

  if (!names?.length) {
    return all;
  }

  const unknown = names.filter((n) => !(n in config.cuttings));
  if (unknown.length) {
    throw new Error(`Nursery: no cuttings named: ${unknown.join(', ')}.`);
  }

  return all.filter(([name]) => names.includes(name));
}
