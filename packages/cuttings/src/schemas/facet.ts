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

/**
 * Every endpoint type that facets can declare, whether `take` implements
 * it yet or not.
 */
export const ALL_ENDPOINT_TYPES = [...BASIC_ENDPOINT_TYPES, ...VERSIONED_ENDPOINT_TYPES] as const;

/**
 * Endpoints that `take` can currently fetch. Other endpoint types are
 * accepted by the schemas so that cutting files remain forward-compatible,
 * but `take` throws on them.
 */
export const IMPLEMENTED_ENDPOINT_TYPES = [
  'GetFile',
  'GetFileComponents',
  'GetFileComponentSets',
  'GetFileStyles',
] as const satisfies readonly (typeof ALL_ENDPOINT_TYPES)[number][];

/**
 * An endpoint type that `take` can currently fetch.
 */
export type ImplementedEndpointType = (typeof IMPLEMENTED_ENDPOINT_TYPES)[number];

/**
 * The last time a facet's data was fetched through the Figma REST API,
 * as a Unix epoch in milliseconds. Zero when never fetched, e.g. in a
 * hand-written cutting config that was not taken yet.
 */
const lastHydrated = z.number().gte(0).default(0);

const VersionedEndpointSchema = z.object({
  id: z.string(),
  endpoint: z.enum(VERSIONED_ENDPOINT_TYPES),
  version: z.string().optional(),
  lastHydrated,
});
const BasicEndpointSchema = z.object({
  id: z.string(),
  endpoint: z.enum(BASIC_ENDPOINT_TYPES),
  lastHydrated,
});

export const FacetSchema = z.discriminatedUnion('endpoint', [
  VersionedEndpointSchema,
  BasicEndpointSchema,
]);

/**
 * A facet describes a source of data stored in a Cutting. It is identified
 * by a REST API endpoint and the id passed to that endpoint, alongside
 * additional parameters for some facet types:
 * - File:         `fileKey`
 * - Style:        `key`
 * - Component:    `key`
 * - ComponentSet: `key`
 * - Project:      `projectId`
 * - Team:         `teamId`
 *
 * Facets maintained by the library also carry a `lastHydrated` timestamp;
 * hand-written facets may omit it.
 */
export type Facet = z.input<typeof FacetSchema>;

/**
 * A facet as stored inside a Cutting that went through `take`, i.e. with
 * its hydration timestamp filled in.
 */
export type HydratedFacet = z.output<typeof FacetSchema>;

/**
 * Checks if a data blob is a valid facet.
 * @param blob The data to check.
 * @returns Whether it is a valid facet.
 */
export function isFacet(blob: unknown): blob is Facet {
  log(`Facet::isFacet: Checking a candidate blob.`);
  const outcome = FacetSchema.safeParse(blob);

  if (outcome.success) {
    log(`Facet::isFacet: Valid facet ${printFacet(blob as Facet)}.`);
    return true;
  } else {
    log(`Facet::isFacet: Invalid facet.\n${printZodError(outcome.error)}`);
    return false;
  }
}
