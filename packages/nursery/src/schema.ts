import { z } from 'zod';

import { NurseryConfigSchema } from './config';

/**
 * Builds the JSON schema published at schema/nursery.schema.json. Single
 * source for both the generation script and the drift test.
 * @returns The JSON schema for the nursery config file.
 */
export function buildConfigJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(NurseryConfigSchema, { io: 'input' }) as Record<
    string,
    unknown
  >;

  jsonSchema.title = 'Figmarine nursery configuration';
  jsonSchema.description =
    'Configuration for the @figmarine/nursery CLI, stored at .figmarine/nursery.json by default.';

  return jsonSchema;
}
