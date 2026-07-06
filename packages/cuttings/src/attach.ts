import type { ClientInterface } from '@figmarine/rest';
import type { InternalAxiosRequestConfig } from 'axios';
import { log } from '@figmarine/logger';

import type { Cutting } from './schemas/cutting';
import type { ImplementedEndpointType } from './schemas/facet';

/**
 * Header set on responses that were served from an attached cutting
 * rather than from the Figma REST API. Its value is the URI-encoded
 * label of the cutting that answered, or `cutting` when unlabeled.
 */
export const CUTTING_SOURCE_HEADER = 'x-figmarine-cutting';

/**
 * The file-scoped REST API URLs that cuttings can answer for, mapped to
 * the endpoint type recorded in facets. Query strings never appear here:
 * the REST client passes query parameters separately.
 */
const URL_PATTERNS: readonly [RegExp, ImplementedEndpointType][] = [
  [/^\/v1\/files\/([^/?#]+)$/, 'GetFile'],
  [/^\/v1\/files\/([^/?#]+)\/components$/, 'GetFileComponents'],
  [/^\/v1\/files\/([^/?#]+)\/component_sets$/, 'GetFileComponentSets'],
  [/^\/v1\/files\/([^/?#]+)\/styles$/, 'GetFileStyles'],
];

/**
 * Query parameters of `GetFile` that a cutting can honour. Cuttings store
 * whole files, so shape-altering parameters (`ids`, `depth`, `geometry`,
 * `plugin_data`) always fall through to the network.
 */
const SERVABLE_GET_FILE_PARAMS = ['branch_data', 'version'];

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Returns the query parameters that actually constrain a request, i.e.
 * those with a meaningful value.
 */
function meaningfulParams(params: unknown): Record<string, unknown> {
  if (typeof params !== 'object' || params === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

/**
 * Finds the cutting able to answer a request, if any.
 * @param cuttings The attached cuttings.
 * @param endpoint The endpoint type matched from the request URL.
 * @param fileKey The file key matched from the request URL.
 * @param params The request's meaningful query parameters.
 * @returns The matching cutting, or undefined to fall through to the network.
 */
function findServingCutting(
  cuttings: Cutting[],
  endpoint: ImplementedEndpointType,
  fileKey: string,
  params: Record<string, unknown>,
): Cutting | undefined {
  if (endpoint === 'GetFile') {
    const paramKeys = Object.keys(params);
    if (paramKeys.some((key) => !SERVABLE_GET_FILE_PARAMS.includes(key))) {
      return undefined;
    }
  } else if (Object.keys(params).length) {
    // Published item endpoints take no query parameters today; a request
    // that passes some is asking for something cuttings don't store.
    return undefined;
  }

  return cuttings.find((cutting) => {
    const facet = cutting.facets.find((f) => f.endpoint === endpoint && f.id === fileKey);
    if (!facet) {
      return false;
    }

    if (endpoint === 'GetFile') {
      const file = cutting.data.files[fileKey];
      if (!file) {
        return false;
      }

      const requestedVersion = params.version;
      if (requestedVersion === undefined) {
        // An unversioned call means "latest". Only unpinned facets track
        // the latest version of a file.
        return !('version' in facet) || facet.version === undefined;
      }

      // A versioned call is served when the cutting holds that exact
      // version, whether through its pin or through the file's own
      // recorded version.
      return (
        requestedVersion === ('version' in facet ? facet.version : undefined) ||
        requestedVersion === file.version
      );
    }

    return true;
  });
}

/**
 * Rebuilds the response body a facet's endpoint would have returned, from
 * the cutting's stored data.
 */
function buildResponseBody(
  cutting: Cutting,
  endpoint: ImplementedEndpointType,
  fileKey: string,
): unknown {
  switch (endpoint) {
    case 'GetFile':
      return cutting.data.files[fileKey];
    case 'GetFileComponents':
      return {
        error: false,
        status: 200,
        meta: {
          components: Object.values(cutting.data.components).filter((c) => c.file_key === fileKey),
        },
      };
    case 'GetFileComponentSets':
      return {
        error: false,
        status: 200,
        meta: {
          component_sets: Object.values(cutting.data.componentSets).filter(
            (c) => c.file_key === fileKey,
          ),
        },
      };
    case 'GetFileStyles':
      return {
        error: false,
        status: 200,
        meta: {
          styles: Object.values(cutting.data.styles).filter((s) => s.file_key === fileKey),
        },
      };
  }
}

/**
 * Attaches cuttings to a `@figmarine/rest` client so that compatible API
 * calls are served from cutting data instead of the network.
 *
 * Compatible calls are `GET` requests to the file-scoped endpoints that
 * cuttings snapshot (`GetFile`, `GetFileComponents`, `GetFileComponentSets`,
 * `GetFileStyles`), for a file key held by an attached cutting, with query
 * parameters the stored data can honour. Anything else falls through to
 * the network untouched, so a partially-covered client keeps working.
 *
 * Served `GetFile` responses contain the cutting's `SlimFile` — the
 * stored subset of the wire format that excludes volatile and
 * access-related fields (`thumbnailUrl`, `role`, `linkAccess`…). Served
 * responses carry the {@link CUTTING_SOURCE_HEADER} response header.
 *
 * The cutting is authoritative regardless of its age: refreshing data is
 * a separate concern, handled by `hydrate` here or by `@figmarine/nursery`
 * refresh schedules.
 *
 * @param client The REST client to attach the cuttings to.
 * @param cuttings The cuttings to serve API calls from. When several
 * cuttings can answer a call, the first one in the array wins.
 * @returns A function that detaches the cuttings from the client.
 */
export function attachCuttings(client: ClientInterface, cuttings: Cutting[]): () => void {
  const interceptorId = client.instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const method = config.method?.toLowerCase() ?? 'get';
      if (method !== 'get' || !config.url) {
        return config;
      }

      const [path] = config.url.split(/[?#]/);
      for (const [pattern, endpoint] of URL_PATTERNS) {
        const match = path.match(pattern);
        if (!match) {
          continue;
        }

        const fileKey = safeDecode(match[1]);
        const params = meaningfulParams(config.params);
        const cutting = findServingCutting(cuttings, endpoint, fileKey, params);
        if (!cutting) {
          log(`Cuttings::attachCuttings: no cutting holds ${endpoint}:${fileKey}, calling out.`);
          return config;
        }

        log(`Cuttings::attachCuttings: serving ${endpoint}:${fileKey} from a cutting.`);
        // A per-request adapter short-circuits the network: axios calls it
        // instead of its HTTP adapter, and response interceptors still run.
        config.adapter = async (servedConfig) => ({
          data: buildResponseBody(cutting, endpoint, fileKey),
          status: 200,
          statusText: 'OK',
          headers: {
            [CUTTING_SOURCE_HEADER]: encodeURIComponent(cutting.meta.label ?? 'cutting'),
          },
          config: servedConfig,
        });
        return config;
      }

      return config;
    },
  );

  log(`Cuttings::attachCuttings: attached ${cuttings.length} cuttings to a REST client.`);

  return () => {
    client.instance.interceptors.request.eject(interceptorId);
    log(`Cuttings::attachCuttings: detached cuttings from a REST client.`);
  };
}
