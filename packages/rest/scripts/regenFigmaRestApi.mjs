import path from 'node:path';
import { createRequire } from 'node:module';

import { generateApi } from 'swagger-typescript-api';

const require = createRequire(import.meta.url);
const spec = require('@figma/rest-api-spec/openapi.json');

await generateApi({
  name: 'figmaRestApi.ts',
  output: path.resolve(import.meta.dirname, '../src/__generated__'),
  spec,
  httpClientType: 'axios',
  extractRequestParams: true,
  extractRequestBody: true,
  extractingOptions: {
    requestBodySuffix: ['RequestBody'],
  },
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
