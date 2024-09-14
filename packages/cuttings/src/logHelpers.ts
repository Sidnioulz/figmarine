import type { ZodError } from 'zod';

import type { Cutting } from './schemas/cutting';
import type { Facet } from './schemas/facet';

/**
 * Returns a string representation of a cutting, using its label,
 * or last known file path if loaded from disk.
 * @param cutting The cutting.
 * @returns The string representation.
 */
export function printCutting(cutting: Cutting): string {
  return cutting.meta.label ?? cutting.meta.lastKnownFilePath ?? '<unnamed>';
}

/**
 * Returns a string representation of a facet, using its endpoint and id.
 * @param facet The facet.
 * @returns The string representation.
 */
export function printFacet(facet: Facet): string {
  return `${facet.endpoint}:${facet.id}`;
}

/**
 * Returns a string representation of a facet, using its endpoint and id.
 * @param facet The facet.
 * @returns The string representation.
 */
export function printFacets(cutting: Cutting): string {
  return cutting.facets.map(printFacet).join('; ');
}

/**
 * Turns a Zod parsing error into a string, with one line per issue found.
 * @param error The Zod parsing error.
 * @returns A multi-line string with the error messages.
 */
export function printZodError(error: ZodError<unknown>): string {
  // TODO: implement.
  return JSON.stringify(error);
}
