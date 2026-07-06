/**
 * Regenerates the real-data API fixtures used by the cuttings test suite.
 *
 * Requires FIGMA_PERSONAL_ACCESS_TOKEN (or FIGMA_OAUTH_TOKEN) to be set, and
 * read access to the fixture files below. Run with:
 *
 *     pnpm --filter @figmarine/cuttings fixtures:regen
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Client } from '@figmarine/rest';

const FIXTURE_FILES = [
  { label: 'figma-api-debug-file', fileKey: 'idLa6ZCXDJUeRFI5wLVNWN' },
  { label: 'error-states', fileKey: '3qv1uKfLSXm4etqj005Rmi' },
  { label: 'surface-new-stories', fileKey: 'pMmZ9LmqB0KbgI8GNY4IW9' },
];

const OUTPUT_DIR = path.resolve(import.meta.dirname, '../src/__fixtures__/api');

const client = await Client({ cache: false, mode: 'production', rateLimit: true });

async function saveFixture(label, endpoint, data) {
  const dir = path.join(OUTPUT_DIR, label);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${endpoint}.json`);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  console.log(`Saved ${path.relative(process.cwd(), file)}`);
}

for (const { label, fileKey } of FIXTURE_FILES) {
  console.log(`Fetching fixture data for '${label}' (${fileKey})…`);

  const [file, components, componentSets, styles] = await Promise.all([
    client.v1.getFile(fileKey, { branch_data: true }),
    client.v1.getFileComponents(fileKey),
    client.v1.getFileComponentSets(fileKey),
    client.v1.getFileStyles(fileKey),
  ]);

  await saveFixture(label, 'GetFile', file.data);
  await saveFixture(label, 'GetFileComponents', components.data);
  await saveFixture(label, 'GetFileComponentSets', componentSets.data);
  await saveFixture(label, 'GetFileStyles', styles.data);
}

console.log('All fixtures regenerated.');
