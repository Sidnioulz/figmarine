import { type Facet, parseFigmaUrl } from '@figmarine/cuttings';

import type { ResolvedNurseryCutting } from './config';

/**
 * Derives the facets to take for a configured cutting: one facet per
 * (file, endpoint) pair, deduplicated when several URLs resolve to the
 * same file. A pinned file `version` is carried onto the `GetFile` facet.
 *
 * Expects a schema-resolved entry (as returned by `loadConfig`) so that
 * endpoint defaults have been applied.
 *
 * @param entry The cutting entry from the resolved nursery config.
 * @throws When a configured URL is not a valid Figma file URL.
 * @returns The facets to pass to `take`.
 */
export function planFacets(entry: ResolvedNurseryCutting): Facet[] {
  const facets = new Map<string, Facet>();

  for (const file of entry.files) {
    const { fileKey } = parseFigmaUrl(file.url);

    for (const endpoint of file.endpoints) {
      const facet: Facet =
        endpoint === 'GetFile' && file.version !== undefined
          ? { endpoint, id: fileKey, version: file.version }
          : { endpoint, id: fileKey };

      facets.set(`${endpoint}:${fileKey}`, facet);
    }
  }

  return [...facets.values()];
}

/**
 * Checks whether the facets stored in a cutting still match the facets
 * planned from the current config, ignoring hydration timestamps. When
 * they do not, the cutting must be re-taken instead of re-hydrated.
 *
 * @param planned Facets derived from the config.
 * @param stored Facets recorded in the planted cutting.
 * @returns Whether both facet sets describe the same data.
 */
export function facetsMatch(planned: Facet[], stored: Facet[]): boolean {
  const describe = (facets: Facet[]) =>
    facets
      .map((f) => `${f.endpoint}:${f.id}:${'version' in f ? (f.version ?? '') : ''}`)
      .sort()
      .join(';');

  return describe(planned) === describe(stored);
}
