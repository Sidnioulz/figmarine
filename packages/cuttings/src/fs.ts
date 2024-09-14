import fs from 'node:fs';
import path from 'node:path';

import { log } from '@figmarine/logger';

import { type Cutting, isCutting } from './schemas/cutting';

function stringifyCutting(cutting: Cutting): string {
  return JSON.stringify(cutting);
}

function parseCuttingString(str: string): Cutting {
  return JSON.parse(str);
}

/**
 * Saves a cutting to disk.
 * @param cutting The cutting to save to disk.
 * @param location The path where to save the cutting.
 */
export function plantCutting(cutting: Cutting, location: string): void {
  log(`Cuttings::plantCutting: Saving cutting to ${location}`);
  const dir = path.dirname(location);
  if (!fs.existsSync(dir)) {
    log(`Cuttings::plantCutting: directory '${dir}' does not exist, attempting to create.`);
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(location)) {
    log(`Cuttings::plantCutting: overwriting existing file at '${location}'.`);
  }

  fs.writeFileSync(
    location,
    stringifyCutting({
      ...cutting,
      meta: {
        ...cutting.meta,
        lastKnownFilePath: undefined,
        lastStored: Date.now(),
      },
    }),
    'utf-8',
  );
  log(`Cuttings::plantCutting: Successfully saved file.`);
}

/**
 * Loads a cutting from disk.
 * @param location The path where to load the cutting.
 * @returns The loaded cutting.
 */
export function digCutting(location: string): Cutting {
  log(`Cuttings::digCutting: Digging location ${location}`);

  const str = fs.readFileSync(location, 'utf-8');
  log(`Cuttings::digCutting: Successfully loaded file.`);

  const cutting = parseCuttingString(str);
  if (!isCutting(cutting)) {
    throw new Error(`Cuttings::digCutting: File did not match expected format: ${location}`);
  }

  log(`Cuttings::digCutting: Successfully parsed file.`);
  cutting.meta.lastKnownFilePath = location;

  return cutting;
}
