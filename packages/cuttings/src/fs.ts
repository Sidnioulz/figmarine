import fs from 'node:fs';
import path from 'node:path';

import { log } from '@figmarine/logger';

import { type Cutting, isCutting } from './schemas/cutting';

function stringifyCutting(cutting: Cutting): string {
  // Cuttings are meant to be committed to consumer repositories, so
  // pretty-print them for reviewable diffs.
  return `${JSON.stringify(cutting, null, 2)}\n`;
}

/**
 * Serialises the parts of a cutting that describe Figma content, leaving
 * out write and hydration timestamps. Two cuttings with equal content
 * should not produce a diff when replanted.
 */
function contentFingerprint(cutting: Cutting): string {
  return JSON.stringify({
    label: cutting.meta.label,
    facets: cutting.facets.map(({ lastHydrated: _lastHydrated, ...facet }) => facet),
    data: cutting.data,
  });
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
    // Keep committed cuttings diff-stable: when only timestamps would
    // change, leave the planted file untouched so refresh loops stay
    // quiet and reviewable diffs only ever contain content changes.
    try {
      const existing = JSON.parse(fs.readFileSync(location, 'utf-8')) as Cutting;
      if (contentFingerprint(existing) === contentFingerprint(cutting)) {
        log(`Cuttings::plantCutting: content unchanged, leaving '${location}' as is.`);
        return;
      }
    } catch {
      log(`Cuttings::plantCutting: could not compare with existing file at '${location}'.`);
    }
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
