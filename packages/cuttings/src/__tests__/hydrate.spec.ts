import type { ClientInterface, V1 } from '@figmarine/rest';
import { test as base } from 'vitest';

import { API_FIXTURE_FILES, loadApiFixture } from '../__fixtures__/api';
import type { Cutting } from '../schemas/cutting';
import { hydrate } from '../hydrate';
import { take } from '../take';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

const FILE_KEY = API_FIXTURE_FILES['figma-api-debug-file'];
const TAKE_TIME = 1751791000000;
const HYDRATE_TIME = 1751795000000;

function mockResponse<T>(data: T) {
  return { status: 200, statusText: 'OK', data };
}

interface HydrateFixtures {
  client: ClientInterface;
  cutting: Cutting;
}
const it = base.extend<HydrateFixtures>({
  client: async ({}, use) => {
    await use({
      v1: {
        getFile: vi.fn(async () => mockResponse(loadApiFixture('figma-api-debug-file', 'GetFile'))),
        getFileStyles: vi.fn(async () =>
          mockResponse(loadApiFixture('figma-api-debug-file', 'GetFileStyles')),
        ),
      },
    } as unknown as ClientInterface);
  },
  cutting: async ({ client }, use) => {
    vi.setSystemTime(TAKE_TIME);
    const cutting = await take({
      client,
      facets: [
        { endpoint: 'GetFile', id: FILE_KEY },
        { endpoint: 'GetFileStyles', id: FILE_KEY },
      ],
      label: 'debug file',
    });
    cutting.meta.lastStored = TAKE_TIME;
    cutting.meta.lastKnownFilePath = '/somewhere/debug.cutting.figmarine.json';
    await use(cutting);
  },
});

describe('@figmarine/cuttings - hydrate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(HYDRATE_TIME);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('refetches every facet of the cutting', async ({ client, cutting }) => {
    await hydrate({ client, cutting });

    expect(client.v1.getFile).toHaveBeenCalledTimes(2);
    expect(client.v1.getFileStyles).toHaveBeenCalledTimes(2);
  });

  it('updates the data with fresh API responses', async ({ client, cutting }) => {
    const freshFile = {
      ...loadApiFixture<V1.GetFile.ResponseBody>('figma-api-debug-file', 'GetFile'),
      version: 'fresher-than-fresh',
    };
    vi.mocked(client.v1.getFile).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockResponse(freshFile) as any,
    );

    const hydrated = await hydrate({ client, cutting });

    expect(hydrated.data.files[FILE_KEY].version).toBe('fresher-than-fresh');
  });

  it('bumps each facet hydration timestamp', async ({ client, cutting }) => {
    const hydrated = await hydrate({ client, cutting });

    expect(hydrated.facets).toHaveLength(2);
    for (const facet of hydrated.facets) {
      expect(facet.lastHydrated).toBe(HYDRATE_TIME);
    }
  });

  it('preserves storage metadata so the cutting can be replanted', async ({ client, cutting }) => {
    const hydrated = await hydrate({ client, cutting });

    expect(hydrated.meta.label).toBe(cutting.meta.label);
    expect(hydrated.meta.lastStored).toBe(TAKE_TIME);
    expect(hydrated.meta.lastKnownFilePath).toBe(cutting.meta.lastKnownFilePath);
  });

  it('does not mutate the original cutting', async ({ client, cutting }) => {
    const before = structuredClone(cutting);

    await hydrate({ client, cutting });

    expect(cutting).toStrictEqual(before);
  });
});
