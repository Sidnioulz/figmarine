import { createRequire } from 'node:module';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { generateApi } from 'swagger-typescript-api';
import { parse } from 'yaml';

const require = createRequire(import.meta.url);

async function fetchUrl(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * Loads the Figma OpenAPI spec. By default, the spec is read from the
 * installed `@figma/rest-api-spec` package, so that generated code always
 * matches the dependency version pinned in package.json (and so that a
 * Dependabot bump of that package regenerates exactly the bumped version).
 *
 * Set the FIGMA_BRANCH environment variable to a branch or tag name of
 * https://github.com/figma/rest-api-spec to generate code for an
 * unreleased spec instead.
 */
async function loadRawSpec() {
  if (process.env.FIGMA_BRANCH) {
    return fetchUrl(
      `https://raw.githubusercontent.com/figma/rest-api-spec/${process.env.FIGMA_BRANCH}/openapi/openapi.yaml`,
    );
  }

  return readFile(require.resolve('@figma/rest-api-spec/openapi/openapi.yaml'), 'utf8');
}

const spec = parse(await loadRawSpec());

await generateApi({
  fileName: 'figmaRestApi.ts',
  output: path.resolve(import.meta.dirname, '../src/__generated__'),
  spec,
  httpClientType: 'axios',
  generateRouteTypes: true,
  hooks: {
    /** Hack used to make it possible to pass `cache: false` to request params. */
    onCreateRequestParams: (data) => {
      if (!data.properties.cache) {
        data.properties.cache = {
          name: 'cache',
          description: 'Cache parameter for the axios-cache-interceptor middleware.',
          in: 'query',
          schema: { type: 'boolean', default: 'false' },
          type: 'boolean',
          $origName: 'cache',
        };
      }
      return data;
    },
  },
});
