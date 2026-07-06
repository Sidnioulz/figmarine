import type { ClientInterface, V1 } from '@figmarine/rest';
import { test as base } from 'vitest';

import { API_FIXTURE_FILES, loadApiFixture } from '../__fixtures__/api';
import { isCutting } from '../schemas/cutting';
import { slimFile } from '../slim';
import { take } from '../take';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

const FILE_KEY = API_FIXTURE_FILES['figma-api-debug-file'];
const NOW = 1751791000000;

/* Test fixtures: a REST client mocked with real recorded API responses. */
function mockResponse<T>(data: T) {
  return { status: 200, statusText: 'OK', data };
}

function makeMockedClient(label: keyof typeof API_FIXTURE_FILES = 'figma-api-debug-file') {
  return {
    v1: {
      getFile: vi.fn(async () => mockResponse(loadApiFixture(label, 'GetFile'))),
      getFileComponents: vi.fn(async () =>
        mockResponse(loadApiFixture(label, 'GetFileComponents')),
      ),
      getFileComponentSets: vi.fn(async () =>
        mockResponse(loadApiFixture(label, 'GetFileComponentSets')),
      ),
      getFileStyles: vi.fn(async () => mockResponse(loadApiFixture(label, 'GetFileStyles'))),
    },
  } as unknown as ClientInterface;
}

interface TakeFixtures {
  client: ClientInterface;
}
const it = base.extend<TakeFixtures>({
  client: async ({}, use) => {
    await use(makeMockedClient());
  },
});

describe('@figmarine/cuttings - take', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('GetFile facets', () => {
    it('stores the file under its file key', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY }],
        label: 'debug file',
      });

      const raw = loadApiFixture<V1.GetFile.ResponseBody>('figma-api-debug-file', 'GetFile');
      expect(Object.keys(cutting.data.files)).toStrictEqual([FILE_KEY]);
      expect(cutting.data.files[FILE_KEY]).toStrictEqual(slimFile(raw));
    });

    it('slims volatile fields out of the stored file', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY }],
      });

      const stored = cutting.data.files[FILE_KEY] as Record<string, unknown>;
      expect(stored.thumbnailUrl).toBeUndefined();
      expect(stored.role).toBeUndefined();
    });

    it('requests branch data and forwards the facet version', async ({ client }) => {
      await take({
        client,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY, version: '42' }],
      });

      expect(client.v1.getFile).toHaveBeenCalledExactlyOnceWith(FILE_KEY, {
        branch_data: true,
        version: '42',
      });
    });
  });

  describe('GetFileComponents facets', () => {
    it('stores published components under their component key', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [{ endpoint: 'GetFileComponents', id: FILE_KEY }],
      });

      const raw = loadApiFixture<{ meta: { components: { key: string }[] } }>(
        'figma-api-debug-file',
        'GetFileComponents',
      );
      expect(Object.keys(cutting.data.components).sort()).toStrictEqual(
        raw.meta.components.map((c) => c.key).sort(),
      );
    });
  });

  describe('GetFileComponentSets facets', () => {
    it('stores published component sets under their key', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [{ endpoint: 'GetFileComponentSets', id: FILE_KEY }],
      });

      const raw = loadApiFixture<{ meta: { component_sets: { key: string }[] } }>(
        'figma-api-debug-file',
        'GetFileComponentSets',
      );
      expect(Object.keys(cutting.data.componentSets).sort()).toStrictEqual(
        raw.meta.component_sets.map((c) => c.key).sort(),
      );
    });
  });

  describe('GetFileStyles facets', () => {
    it('stores published styles under their key', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [{ endpoint: 'GetFileStyles', id: FILE_KEY }],
      });

      const raw = loadApiFixture<{ meta: { styles: { key: string }[] } }>(
        'figma-api-debug-file',
        'GetFileStyles',
      );
      expect(Object.keys(cutting.data.styles).sort()).toStrictEqual(
        raw.meta.styles.map((s) => s.key).sort(),
      );
    });
  });

  describe('whole cuttings', () => {
    it('combines multiple facets into one valid cutting', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [
          { endpoint: 'GetFile', id: FILE_KEY },
          { endpoint: 'GetFileComponents', id: FILE_KEY },
          { endpoint: 'GetFileComponentSets', id: FILE_KEY },
          { endpoint: 'GetFileStyles', id: FILE_KEY },
        ],
        label: 'debug file',
      });

      expect(cutting.meta.label).toBe('debug file');
      expect(cutting.meta.figmarineVersion).toBe(0);
      expect(cutting.meta.lastStored).toBe(0);
      expect(cutting.facets).toHaveLength(4);
      expect(isCutting(JSON.parse(JSON.stringify(cutting)))).toBe(true);
    });

    it('records when each facet was hydrated', async ({ client }) => {
      const cutting = await take({
        client,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY }],
      });

      expect(cutting.facets[0].lastHydrated).toBe(NOW);
    });

    it('supports data from several files in one cutting', async ({ client }) => {
      const otherKey = API_FIXTURE_FILES['error-states'];
      const cutting = await take({
        client,
        facets: [
          { endpoint: 'GetFile', id: FILE_KEY },
          { endpoint: 'GetFile', id: otherKey },
        ],
      });

      expect(Object.keys(cutting.data.files).sort()).toStrictEqual([FILE_KEY, otherKey].sort());
    });
  });

  describe('error handling', () => {
    it('throws on unimplemented endpoint types', async ({ client }) => {
      await expect(() =>
        take({
          client,
          facets: [{ endpoint: 'GetTeamComponents', id: '12345' }],
        }),
      ).rejects.toThrowError('endpoint type GetTeamComponents is not implemented yet');
    });

    it('throws when a facet request does not succeed', async ({ client }) => {
      vi.mocked(client.v1.getFile).mockResolvedValueOnce({
        status: 404,
        statusText: 'Not Found',
        data: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(() =>
        take({
          client,
          facets: [{ endpoint: 'GetFile', id: 'missing' }],
        }),
      ).rejects.toThrowError('network call failed for facet GetFile:missing. 404: Not Found');
    });

    it('propagates client rejections', async ({ client }) => {
      vi.mocked(client.v1.getFile).mockRejectedValueOnce(new Error('boom'));

      await expect(() =>
        take({
          client,
          facets: [{ endpoint: 'GetFile', id: FILE_KEY }],
        }),
      ).rejects.toThrowError('boom');
    });
  });
});
