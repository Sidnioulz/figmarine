/**
 * Regenerates the real-data API fixtures used by the cuttings test suite.
 *
 * Requires FIGMA_PERSONAL_ACCESS_TOKEN (or FIGMA_OAUTH_TOKEN) to be set, and
 * read access to the fixture files below. Run with:
 *
 *     pnpm --filter @figmarine/cuttings fixtures:regen
 *
 * The run takes a couple of minutes: the REST client rate-limits itself to
 * 10 requests per minute and the script makes 12 — quiet pauses between
 * files are expected, do not interrupt them.
 *
 * Two caveats about the recorded data:
 * - Documents are depth-truncated (see FIXTURE_FILES), so `components` and
 *   `styles` maps may reference node ids that lie beyond the recorded
 *   depth. Real cuttings are always taken at full depth.
 * - Volatile per-request fields (signed thumbnail URLs, the requester's
 *   role) are normalised below so regeneration against unchanged Figma
 *   files produces no diff.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Client } from '@figmarine/rest';

/**
 * Full document trees for these files weigh 48MB to 400MB, far beyond what
 * a repository should carry, so each file is recorded at the deepest depth
 * that keeps its GetFile fixture in the hundreds-of-kilobytes range.
 */
const FIXTURE_FILES = [
  { label: 'figma-api-debug-file', fileKey: 'idLa6ZCXDJUeRFI5wLVNWN', depth: 4 },
  { label: 'error-states', fileKey: '3qv1uKfLSXm4etqj005Rmi', depth: 3 },
  { label: 'surface-new-stories', fileKey: 'pMmZ9LmqB0KbgI8GNY4IW9', depth: 2 },
];

const OUTPUT_DIR = path.resolve(import.meta.dirname, '../src/__fixtures__/api');

const STABLE_THUMBNAIL = 'https://figma-thumbnails.example/redacted';

/**
 * Normalises fields that differ on every request or per requester, so
 * that regenerating fixtures against unchanged Figma files is a no-op.
 */
function stabilize(body) {
  if (typeof body.thumbnailUrl === 'string') {
    body.thumbnailUrl = STABLE_THUMBNAIL;
  }
  if (typeof body.role === 'string') {
    body.role = 'viewer';
  }
  for (const branch of body.branches ?? []) {
    if (typeof branch.thumbnail_url === 'string') {
      branch.thumbnail_url = STABLE_THUMBNAIL;
    }
  }
  for (const items of Object.values(body.meta ?? {})) {
    for (const item of Array.isArray(items) ? items : []) {
      if (typeof item.thumbnail_url === 'string') {
        item.thumbnail_url = STABLE_THUMBNAIL;
      }
    }
  }
  return body;
}

const client = await Client({ cache: false, mode: 'production', rateLimit: true });

async function saveFixture(label, endpoint, data) {
  const dir = path.join(OUTPUT_DIR, label);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${endpoint}.json`);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  console.log(`Saved ${path.relative(process.cwd(), file)}`);
}

for (const { label, fileKey, depth } of FIXTURE_FILES) {
  console.log(`Fetching fixture data for '${label}' (${fileKey})…`);

  const [file, components, componentSets, styles] = await Promise.all([
    client.v1.getFile(fileKey, { branch_data: true, depth }),
    client.v1.getFileComponents(fileKey),
    client.v1.getFileComponentSets(fileKey),
    client.v1.getFileStyles(fileKey),
  ]);

  await saveFixture(label, 'GetFile', stabilize(file.data));
  await saveFixture(label, 'GetFileComponents', stabilize(components.data));
  await saveFixture(label, 'GetFileComponentSets', stabilize(componentSets.data));
  await saveFixture(label, 'GetFileStyles', stabilize(styles.data));
}

console.log('All fixtures regenerated.');
