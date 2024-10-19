import https from 'node:https';
import path from 'node:path';

import { generateApi } from 'swagger-typescript-api';
import { parse } from 'yaml';

import prettierConfig from '../prettier.config.js';

// import { createRequire } from 'node:module';
// const require = createRequire(import.meta.url);
// const spec = require('@figma/rest-api-spec/openapi.json');

// FIXME: Temporarily fetching the YAML spec directly from GitHub until
// https://github.com/figma/rest-api-spec/pull/18 is fixed upstream.
const OAS_URL = process.env.FIGMA_BRANCH
  ? `https://raw.githubusercontent.com/figma/rest-api-spec/refs/tags/${process.env.FIGMA_BRANCH}/openapi/openapi.yaml`
  : 'https://raw.githubusercontent.com/figma/rest-api-spec/refs/heads/main/openapi/openapi.yaml';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

const yamlContent = await fetchUrl(OAS_URL);
const spec = parse(yamlContent);

await generateApi({
  name: 'figmaRestApi.ts',
  output: path.resolve(import.meta.dirname, '../src/__generated__'),
  spec,
  httpClientType: 'axios',
  generateRouteTypes: true,
  prettier: prettierConfig,
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
