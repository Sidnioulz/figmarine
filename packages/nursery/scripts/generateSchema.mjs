/**
 * Regenerates schema/nursery.schema.json from the zod config schema.
 * Run with: pnpm --filter @figmarine/nursery schema:regen
 * (requires a prior build, as it imports the built package)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildConfigJsonSchema } from '../dist/index.js';

const OUTPUT = path.resolve(import.meta.dirname, '../schema/nursery.schema.json');

await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(buildConfigJsonSchema(), null, 2)}\n`, 'utf-8');
console.log(`Saved ${path.relative(process.cwd(), OUTPUT)}`);
