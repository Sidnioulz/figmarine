import type { AxiosResponse } from 'axios';
import type { ClientInterface } from '@figmarine/rest';
import { log } from '@figmarine/logger';

import type { Cutting } from './schemas/cutting';
import { Facet } from './schemas/facet';
import { printFacet } from './logHelpers';
import { slimFile } from './slim';

/**
 * Creates an empty Cutting.
 * @param {string} opts.label An optional but highly recommended label describing the Cutting.
 * @returns An empty Cutting.
 */
function initCutting({ label }: { label?: string } = {}): Cutting {
  return {
    meta: {
      figmarineVersion: 0,
      label,
      lastStored: 0,
      lastKnownFilePath: undefined,
    },
    facets: [],
    data: {
      components: {},
      componentSets: {},
      files: {},
      localVariables: {},
      localVariableCollections: {},
      projects: {},
      publishedVariables: {},
      publishedVariableCollections: {},
      styles: {},
    },
  };
}

/**
 * Throws when a facet's network call did not succeed. The REST client
 * already rejects on most non-2xx responses; this guards against clients
 * configured otherwise.
 * @param response The Axios response received for the facet.
 * @param facet The facet being loaded.
 */
function assertResponseOk<T>(response: AxiosResponse<T>, facet: Facet): void {
  if (response.status !== 200) {
    throw new Error(
      `Cuttings::take: network call failed for facet ${printFacet(facet)}. ${response.status}: ${response.statusText}.`,
    );
  }
}

/**
 * Fetches one facet's data and merges it into a Cutting's data record.
 * @param client The REST API client to fetch with.
 * @param facet The facet to load.
 * @param cutting The cutting to fill.
 */
async function loadFacet(client: ClientInterface, facet: Facet, cutting: Cutting): Promise<void> {
  switch (facet.endpoint) {
    case 'GetFile': {
      const response = await client.v1.getFile(facet.id, {
        // depth, ids, geometry, plugin_data are not yet supported until we introduce facet options.
        branch_data: true,
        version: facet.version,
      });
      assertResponseOk(response, facet);
      cutting.data.files[facet.id] = slimFile(response.data);
      break;
    }

    case 'GetFileComponents': {
      const response = await client.v1.getFileComponents(facet.id);
      assertResponseOk(response, facet);
      for (const component of response.data.meta.components) {
        cutting.data.components[component.key] = component;
      }
      break;
    }

    case 'GetFileComponentSets': {
      const response = await client.v1.getFileComponentSets(facet.id);
      assertResponseOk(response, facet);
      for (const componentSet of response.data.meta.component_sets) {
        cutting.data.componentSets[componentSet.key] = componentSet;
      }
      break;
    }

    case 'GetFileStyles': {
      const response = await client.v1.getFileStyles(facet.id);
      assertResponseOk(response, facet);
      for (const style of response.data.meta.styles) {
        cutting.data.styles[style.key] = style;
      }
      break;
    }

    default:
      throw new Error(`Cuttings::take: endpoint type ${facet.endpoint} is not implemented yet.`);
  }
}

/**
 * Options for {@link take}.
 */
export type TakeOptions = {
  /**
   * The `@figmarine/rest` client used to call the Figma REST API.
   */
  client: ClientInterface;

  /**
   * The facets to fetch into the new Cutting.
   */
  facets: Facet[];

  /**
   * An optional but highly recommended label describing the Cutting.
   */
  label?: string;
};

/**
 * Takes a new Cutting: fetches every facet through the Figma REST API and
 * stores the results in a fresh Cutting.
 *
 * Facets are fetched sequentially on purpose: the REST client applies rate
 * limiting per request, and bursts of parallel file downloads are the main
 * way to hit Figma's rate limits.
 *
 * @param options See {@link TakeOptions}.
 * @returns The new Cutting.
 */
export async function take({ client, facets, label }: TakeOptions): Promise<Cutting> {
  log(`Cuttings::take: starting analysis of ${facets.length} facets.`);

  const cutting = initCutting({ label });

  for (const facet of facets) {
    log(`Cuttings::take: loading facet ${printFacet(facet)}.`);
    await loadFacet(client, facet, cutting);
    log(`Cuttings::take: successfully loaded facet ${printFacet(facet)}.`);

    cutting.facets.push({ ...facet, lastHydrated: Date.now() });
  }

  log(`Cuttings::take: done, loaded ${cutting.facets.length} facets.`);

  return cutting;
}
