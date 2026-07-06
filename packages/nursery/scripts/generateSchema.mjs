/**
 * Regenerates schema/nursery.schema.json from the zod config schema.
 * Run with: pnpm --filter @figmarine/nursery schema:regen
 * (requires a prior build, as it imports the built package)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { NurseryConfigSchema } from '../dist/index.js';

const OUTPUT = path.resolve(import.meta.dirname, '../schema/nursery.schema.json');

const jsonSchema = z.toJSONSchema(NurseryConfigSchema, { io: 'input' });
jsonSchema.title = 'Figmarine nursery configuration';
jsonSchema.description =
  'Configuration for the @figmarine/nursery CLI, stored at .figmarine/nursery.json by default.';

await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(jsonSchema, null, 2)}\n`, 'utf-8');
console.log(`Saved ${path.relative(process.cwd(), OUTPUT)}`);
