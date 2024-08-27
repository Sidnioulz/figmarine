import fs from 'node:fs';
// import path from 'node:path';

import type { ClientInterface, V1 } from '@figmarine/rest';
import { log } from '@figmarine/logger';

import { Client } from '@figmarine/rest';
const tmpClient = await Client();

/*
 * Nursery
 *  │
 *  ├─►Order
 *  │   ├─►Cutting
 *  │   └─►Cutting
 *  │
 *  └─►Order
 *      ├─►Cutting
 *      └─►Cutting
 *
 * Team
 *  │
 *  ├─►Project
 *  │   │
 *  ├───┴─►File
 *  │       │
 *  ├───────┼─►Component
 *  │       │
 *  ├───────┼─►ComponentSet
 *  │       │
 *  └───────┴─►Style
 */

type CuttingType = 'file' | 'style' | 'component' | 'componentSet' | 'project' | 'team';

type CuttingFacets = {
  // TODO/FIXME: save only boolean and use other opts, or pass FileGetOps?
  files?: boolean;

  // TODO: if `true` include geometry: 'path'?
  vectorData?: boolean;

  // TODO: but consider this means base64'ing images, v. large
  imageFills?: boolean;

  branchData?: boolean;

  ////////////////////////////////////////////////////////////
  // TODO
  comments?: boolean;

  ////////////////////////////////////////////////////////////
  // TODO: either false (none); true (all); or commentId[]
  commentReactions?: boolean | string[];

  ////////////////////////////////////////////////////////////
  // TODO: either false (none); true (all); or id[]
  components?: boolean;
  ////////////////////////////////////////////////////////////
  // TODO: either false (none); true (all); or id[]
  componentSets?: boolean;
  ////////////////////////////////////////////////////////////
  // TODO: either false (none); true (all); or id[]
  styles?: boolean;

  ////////////////////////////////////////////////////////////
  // TODO
  versions?: boolean;

  // TODO: projects, teams, etc.
};

// type FileCuttingIdData = {
//   fileKey: string;
//   version: string;
//   mainFileKey: string;
// };

// type StyleCuttingIdData = {
//   key: string;
// };

// type ComponentCuttingIdData = {
//   key: string;
// };

// type ComponentSetCuttingIdData = {
//   key: string;
// };

// type ProjectCuttingIdData = {
//   projectId: string;
// };

// type TeamCuttingIdData = {
//   teamId: string;
// };

/**
 * TODO doc
 */
type Cutting = {
  meta: {
    /**
     * TODO
     */
    loaded: boolean;

    /**
     * TODO
     */
    stored: boolean;

    /**
     * TODO
     */
    origin: 'api' | 'cache' | 'file';

    /**
     * TODO doc
     */
    lastHydrated: number;

    /**
     * TODO doc
     */
    apiVersion: number;

    /**
     * TODO doc
     */
    id: string;

    /**
     * TODO doc
     */
    type: CuttingType;

    /**
     * TODO doc
     */
    version?: string;

    // FIXME: find a good way to represent the identity of a cutting based on type
    // idData: FileCuttingIdData;
  };

  /**
   * TODO doc
   */
  facets: CuttingFacets;

  /**
   * TODO doc
   */
  data: {
    files?: V1.GetFile.ResponseBody[];
    components?: V1.GetFileComponents.ResponseBody[];
    componentSets?: V1.GetFileComponentSets.ResponseBody[];
    comments?: V1.GetComments.ResponseBody[];
    commentReactions?: {
      [key: string]: V1.GetCommentReactions.ResponseBody[];
    };
    versions?: V1.GetFileVersions.ResponseBody[];
    styles?: V1.GetFileStyles.ResponseBody[];
  };
};

type TakeOptions = {
  client: ClientInterface;
  facets: CuttingFacets;
  id: string;
  type: CuttingType;
  version?: string;
};

type TakeFileOptions = {
  client: ClientInterface;
  facets: CuttingFacets;
  id: string;
  version?: string;
};

// TODO:
// type TakeStyleOptions = {
//   client: ClientInterface;
//   facets: CuttingFacets;
//   id: string;
// };
//
// Etc.

// TODO: review this whole func.
export function isCutting(blob: unknown): blob is Cutting {
  // TODO log debug

  // TODO apiVersion

  if (!blob || typeof blob !== 'object') {
    // TODO log debug
    return false;
  }

  if (!('timestamp' in blob) || typeof blob.timestamp !== 'number' || blob.timestamp < 0) {
    // TODO log debug
    return false;
  }

  if (!('facets' in blob) || !blob.facets || typeof blob.facets !== 'object') {
    return false;
  }

  if (!('data' in blob) || !blob.data || typeof blob.data !== 'object') {
    return false;
  }

  if (!('files' in blob.data) || typeof blob.data.files !== 'object') {
    return false;
  }

  // TODO more facets to init

  return true;
}

function initCutting({
  id,
  origin,
  type,
  version,
}: {
  id: Cutting['meta']['id'];
  origin: Cutting['meta']['origin'];
  type: Cutting['meta']['type'];
  version: Cutting['meta']['version'];
}): Partial<Omit<Cutting, 'data' | 'facets' | 'meta'>> & Pick<Cutting, 'data' | 'facets' | 'meta'> {
  return {
    meta: {
      apiVersion: 1,
      loaded: false,
      stored: false,
      id,
      origin,
      lastHydrated: Date.now(),
      version,
      type,
    },
    facets: {
      files: false,
      branchData: false,
      vectorData: false,
      imageFills: false,
      components: false,
      componentSets: false,
      comments: false,
      commentReactions: false,
      versions: false,
      styles: false,
    },
    data: {},
  };
}

export async function take({ client, facets, id, type, version }: TakeOptions): Promise<Cutting> {
  log(
    `Cuttings:take:: taking ${id}${version ? ` (v${version})` : ''} with facets ${Object.entries(
      facets,
    )
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(', ')}.`,
  );

  if (type === 'file') {
    return await takeFile({ client, facets, id, version });
  }

  // TODO more

  throw new Error(`Cuttings:take:: unrecognised type '${type}'.`);
}

export async function takeFile({ client, facets, id, version }: TakeFileOptions): Promise<Cutting> {
  log(`Cuttings:takeFile:: taking ${id}${version ? ` (v${version})` : ''} with facets ${facets}.`);
  const cutting = initCutting({ id, origin: 'api', version, type: 'file' });

  if (facets.files) {
    log(`Cuttings:takeFile:: loading file '${id}'.`);
    const response = await client.v1.getFile(id, {
      // depth, ids, plugin_data are not yet supported until we introduce facet options.
      branch_data: facets.branchData,
      geometry: facets.vectorData ? 'paths' : undefined,
      version,
    });
    if (response.status === 200) {
      log(`Cuttings:takeFile:: successfully loaded file '${id}'.`);
      cutting.data.files = [response.data];
      cutting.facets.files = true;
    } else {
      throw new Error('TODO');
    }
  }

  // if (facets.imageFills) {
  //   log(`Cuttings:takeFile:: loading imageFills for file '${id}'.`);
  //   const response = await client.v1.getImageFills(id);
  //   if (response.status === 200) {
  //     log(`Cuttings:takeFile:: successfully loaded imageFills for file '${id}'.`);
  //     // FIXME: gotta download and base64 encode the data
  //     cutting.data.imageFills = [response.data];
  //     cutting.facets.imageFills = true;
  //   } else {
  //     throw new Error('TODO');
  //   }
  // }

  if (facets.components) {
    log(`Cuttings:takeFile:: loading components for file '${id}'.`);
    const response = await client.v1.getFileComponents(id);
    if (response.status === 200) {
      log(`Cuttings:takeFile:: successfully loaded components for file '${id}'.`);
      cutting.data.components = [response.data];
      cutting.facets.components = true;
    } else {
      throw new Error('TODO');
    }
  }

  if (facets.componentSets) {
    log(`Cuttings:takeFile:: loading componentSets for file '${id}'.`);
    const response = await client.v1.getFileComponentSets(id);
    if (response.status === 200) {
      log(`Cuttings:takeFile:: successfully loaded componentSets for file '${id}'.`);
      cutting.data.componentSets = [response.data];
      cutting.facets.componentSets = true;
    } else {
      throw new Error('TODO');
    }
  }

  if (facets.comments) {
    log(`Cuttings:takeFile:: loading comments for file '${id}'.`);
    const response = await client.v1.getComments(id);
    if (response.status === 200) {
      log(`Cuttings:takeFile:: successfully loaded comments for file '${id}'.`);
      cutting.data.comments = [response.data];
      cutting.facets.comments = true;
    } else {
      throw new Error('TODO');
    }
  }

  // if (facets.commentReactions) {
  //   log(`Cuttings:takeFile:: loading comment reactions for file '${id}'.`);
  //   // TODO: iterate over every comment in data.comments.
  //   const response = await client.v1.getCommentReactions(id);
  //   if (response.status === 200) {
  //     log(`Cuttings:takeFile:: successfully loaded comments for file '${id}'.`);
  //     cutting.data.comments = [response.data];
  //     cutting.facets.comments = true;
  //   } else {
  //     throw new Error('TODO');
  //   }
  // }

  if (facets.versions) {
    log(`Cuttings:takeFile:: loading versions for file '${id}'.`);
    const response = await client.v1.getFileVersions(id);
    if (response.status === 200) {
      log(`Cuttings:takeFile:: successfully loaded versions for file '${id}'.`);
      cutting.data.versions = [response.data];
      cutting.facets.versions = true;
    } else {
      throw new Error('TODO');
    }
  }

  if (facets.styles) {
    log(`Cuttings:takeFile:: loading styles for file '${id}'.`);
    const response = await client.v1.getFileStyles(id);
    if (response.status === 200) {
      log(`Cuttings:takeFile:: successfully loaded styles for file '${id}'.`);
      cutting.data.styles = [response.data];
      cutting.facets.styles = true;
    } else {
      throw new Error('TODO');
    }
  }

  return cutting as Cutting;
}

// function plantCutting(cutting: Cutting, location: string): void {
// }

// function readCutting(location: string): Cutting {
// }

// function hydrateCutting(location: string): Cutting {
// }

// function hydrateCutting(cutting: Cutting): Cutting {
// }

// function hydrateCutting({ fileKey, facets }: Cutting): Cutting {
// }

// function getCutting({ fileKey, facets, location }) {
// }

const id = 'AsomiQXJ7FlTRkqej4sygf';

const debugCutting = await takeFile({
  client: tmpClient,
  id,
  facets: {
    files: true,
    comments: true,
    styles: true,
  },
});

fs.writeFileSync(
  '../dbgFile.cutting.figmarine.json',
  JSON.stringify(debugCutting, null, 2),
  'utf-8',
);
