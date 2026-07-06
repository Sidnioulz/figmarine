import type {
  LocalVariable,
  LocalVariableCollection,
  Project,
  PublishedComponent,
  PublishedComponentSet,
  PublishedStyle,
  PublishedVariable,
  PublishedVariableCollection,
} from '@figmarine/rest';
import { log } from '@figmarine/logger';
import { z } from 'zod';

import { printCutting, printZodError } from '../logHelpers';
import { FacetSchema } from './facet';
import type { SlimFile } from '../slim';

export const CuttingSchema = z.object({
  meta: z.object({
    /**
     * An optional descriptive label for human use.
     */
    label: z.string().optional(),

    /**
     * The last time this data was stored to disk, if ever. Defaults to zero when never saved.
     */
    lastStored: z.number(),

    /**
     * If the Cutting was just loaded from disk, set to the file path it was loaded from.
     */
    lastKnownFilePath: z.string().optional(),

    /**
     * Major version number of the Figmarine API used to create a Cutting.
     */
    figmarineVersion: z.number().gte(0).lte(0),
  }),

  /**
   * Endpoints that must be called to fetch or re-hydrate this Cutting's data.
   */
  facets: z.array(FacetSchema),

  /**
   * Data stored in the Cutting.
   */
  data: z.object({
    components: z.record(z.string(), z.looseObject({})),
    componentSets: z.record(z.string(), z.looseObject({})),
    files: z.record(z.string(), z.looseObject({})),
    localVariables: z.record(z.string(), z.looseObject({})),
    localVariableCollections: z.record(z.string(), z.looseObject({})),
    projects: z.record(z.string(), z.looseObject({})),
    publishedVariables: z.record(z.string(), z.looseObject({})),
    publishedVariableCollections: z.record(z.string(), z.looseObject({})),
    styles: z.record(z.string(), z.looseObject({})),
  }),
});

/**
 * A Cutting is a collection of Figma data fetched over the REST API.
 * It contains an array of `facets`, which record a data point fetched
 * over the API, its type and when it was last fetched. It also contains
 * a `data` object, with components, component sets, files, projects,
 * styles and variables, which are filled by the Cutting when it calls
 * facet endpoints. Each of these data objects is a dictionary where
 * keys are ids (e.g. `fileKey` for `data.files`, published `key` for
 * `data.components`) and values are the item being represented. All
 * types come from Figma except for File types, which are simplified
 * from `GetFile` response bodies to exclude irrelevant data.
 */
export type Cutting = {
  /**
   * The Cutting's metadata.
   */
  meta: z.infer<typeof CuttingSchema.shape.meta>;

  /**
   * The Cutting's array of facets.
   */
  facets: z.input<typeof CuttingSchema.shape.facets>;

  /**
   * The Cutting's stored data.
   */
  data: {
    components: Record<string, PublishedComponent>;
    componentSets: Record<string, PublishedComponentSet>;
    files: Record<string, SlimFile>;
    localVariables: Record<string, LocalVariable>;
    localVariableCollections: Record<string, LocalVariableCollection>;
    projects: Record<string, Project>;
    publishedVariables: Record<string, PublishedVariable>;
    publishedVariableCollections: Record<string, PublishedVariableCollection>;
    styles: Record<string, PublishedStyle>;
  };
};

/**
 * Checks if a data blob is a valid Cutting.
 * @param blob The data to check.
 * @returns Whether it is a valid Cutting.
 */
export function isCutting(blob: unknown): blob is Cutting {
  // Do not stringify the blob: real cuttings weigh megabytes.
  log(`Cutting::isCutting: Checking a candidate blob.`);
  const outcome = CuttingSchema.safeParse(blob);

  if (outcome.success) {
    log(`Cutting::isCutting: Valid cutting ${printCutting(blob as Cutting)}.`);
    return true;
  } else {
    log(`Cutting::isCutting: Invalid cutting.\n${printZodError(outcome.error)}`);
    return false;
  }
}
