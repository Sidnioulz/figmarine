import type { AxiosResponse } from 'axios';
import type { ClientInterface } from '@figmarine/rest';
import { log } from '@figmarine/logger';

import type { Cutting } from './schemas/cutting';
import { Facet } from './schemas/facet';
import { printFacet } from './logHelpers';

/**
 * Creates an empty Cutting.
 * @param {string} opts.label An optional but highly recommended label describing the Cutting.
 * @returns An empty Cutting.
 */
function initCutting({ facets, label }: { facets?: Facet[]; label?: string } = {}): Cutting {
  return {
    meta: {
      figmarineVersion: 0,
      label,
      lastStored: 0,
      lastKnownFilePath: undefined,
    },
    facets: facets ?? [],
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
 * TODO doc
 */
function handleTakeResponse<T = unknown>(response: AxiosResponse<T>): void {
  if (response.status !== 200) {
    throw new Error(
      `Cuttings::take: network call failed. ${response.status}: ${response.statusText}.`,
    );
  }
}

/**
 * TODO doc
 */
export type TakeOptions = {
  client: ClientInterface;
  facets: Facet[];
  label: string;
};

/**
 * TODO doc
 * @param param0
 * @returns
 */
export async function take({ client, facets, label }: TakeOptions): Promise<Cutting> {
  log(`Cuttings:take:: starting analysis of facets.`);

  const cutting = initCutting({ facets, label });

  for (const facet of facets) {
    log(`Cuttings:take:: loading facet: ${printFacet(facet)}`);

    if (facet.endpoint === 'GetFile') {
      log(`Cuttings:take::   loading file ${facet.id}`);
      const response = await client.v1.getFile(facet.id, {
        // depth, ids, geometry, plugin_data are not yet supported until we introduce facet options.
        branch_data: true,
        version: facet.version,
      });

      handleTakeResponse(response);
      log(`Cuttings::take: successfully loaded file '${facet.id}'.`);
      // TODO: remove unnecessary content
      cutting.data.files.id = response.data;
    } else {
      throw new Error(`Cuttings:take:: endpoint type ${facet.endpoint} is not implemented yet.`);
    }
  }

  return cutting;
}
