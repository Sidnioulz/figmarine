import { log } from '@figmarine/logger';
import { z } from 'zod';

import { printFacet, printZodError } from '../logHelpers';

const BASIC_ENDPOINT_TYPES = [
  // COMPONENT
  'GetComponent',
  'GetFileComponents',
  'GetTeamComponents',

  // COMPONENT SET
  'GetComponentSet',
  'GetFileComponentSets',
  'GetTeamComponentSets',

  // FILE
  'GetProjectFiles',

  // PROJECT
  'GetTeamProjects',

  // STYLE
  'GetStyle',
  'GetFileStyles',
  'GetTeamStyles',

  // VARIABLE
  'GetLocalVariables',
  'GetPublishedVariables',
] as const;
const VERSIONED_ENDPOINT_TYPES = ['GetFile'] as const;

const ALL_ENDPOINT_TYPES = [...BASIC_ENDPOINT_TYPES, ...VERSIONED_ENDPOINT_TYPES] as const;

const VersionedEndpointSchema = z.object({
  id: z.string(),
  endpoint: z.enum(VERSIONED_ENDPOINT_TYPES),
  version: z.string().optional(),
});
const BasicEndpointSchema = z.object({
  id: z.string(),
  endpoint: z.enum(BASIC_ENDPOINT_TYPES),
});

export const FacetSchema = z.discriminatedUnion('endpoint', [
  VersionedEndpointSchema,
  BasicEndpointSchema,
]);

/**
 * Metadata for a Cutting facet. Includes the identifying information passed by
 * the user and the metadata maintained by the library. Should be sufficient to
 * know what data a facet fetches, with what API, and how old it is.
 */
export type Facet = z.infer<typeof FacetSchema>;

export const FacetMetaSchema = z.object({
  /**
   * Type of data referred to here.
   */
  endpoint: z.enum(ALL_ENDPOINT_TYPES),

  /**
   * Identifier for this data. Interpreted based on the data type being referred to:
   * - File:         `fileKey`
   * - Style:        `key`
   * - Component:    `key`
   * - ComponentSet: `key`
   * - Project:      `projectId`
   * - Team:         `teamId`
   */
  id: z.string(),

  /**
   * Secondary identifying information for some API endpoints / cutting types.
   */
  version: z.string().optional(),

  /**
   * Major version number of the Figma REST API used to fill data into a Cutting.
   */
  apiVersion: z.number().gte(1).lte(2),

  /**
   * The last time this data was fetched through the Figma REST API. Defaults to zero when never fetched.
   */
  lastHydrated: z.number(),
});

/**
 * A facet describes a source of data stored in the Cutting. It's
 * identified by a REST API endpoint and id param passed to the
 * endpoint, alongside additional parameters for some facet types.
 */
export type FacetMeta = z.infer<typeof FacetMetaSchema>;

/**
 * Checks if a data blob is a valid facet.
 * @param blob The data to check.
 * @returns Whether it is a valid facet.
 */
export function isFacet(blob: unknown): blob is Facet {
  log(`Facet::isFacet: Checking out the following blob: ${JSON.stringify(blob)}`);
  const outcome = FacetSchema.safeParse(blob);

  if (outcome.success) {
    log(`Facet::isFacet: Valid facet ${printFacet(blob as Facet)}.`);
    return true;
  } else {
    log(`Facet::isFacet: Invalid facet.\n${printZodError(outcome.error)}`);
    return false;
  }
}
