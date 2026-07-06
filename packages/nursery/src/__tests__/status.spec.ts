import { vol } from 'memfs';

import { debugFileConfig, debugFileCutting } from '../__fixtures__/cutting';
import { status } from '../commands/status';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

const CONFIG_PATH = '/repo/.figmarine/nursery.json';
const CUTTING_PATH = '.figmarine/cuttings/debug-file.cutting.figmarine.json';
const HYDRATION_TIME = 1751791000000;
const NOW = HYDRATION_TIME + 3_600_000; // one hour later

describe('@figmarine/nursery - status command', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ [CONFIG_PATH]: JSON.stringify(debugFileConfig) });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports unplanted cuttings as missing and stale', () => {
    const reports = status({ configPath: CONFIG_PATH });

    expect(reports).toStrictEqual([
      {
        name: 'debug-file',
        location: CUTTING_PATH,
        planted: false,
        stale: true,
      },
    ]);
  });

  it('reports the age of planted cuttings', () => {
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(debugFileCutting) });

    const reports = status({ configPath: CONFIG_PATH, now: () => NOW });

    expect(reports[0]).toStrictEqual({
      name: 'debug-file',
      location: CUTTING_PATH,
      planted: true,
      facetCount: 2,
      oldestHydration: HYDRATION_TIME,
      stale: false,
    });
  });

  it('reports the oldest facet hydration as the cutting age', () => {
    const cutting = structuredClone(debugFileCutting);
    cutting.facets[1].lastHydrated = HYDRATION_TIME - 10_000;
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(cutting) });

    const reports = status({ configPath: CONFIG_PATH, now: () => NOW });

    expect(reports[0].oldestHydration).toBe(HYDRATION_TIME - 10_000);
  });

  it('flags cuttings older than max-age as stale', () => {
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(debugFileCutting) });

    const fresh = status({ configPath: CONFIG_PATH, maxAgeSeconds: 7200, now: () => NOW });
    const stale = status({ configPath: CONFIG_PATH, maxAgeSeconds: 1800, now: () => NOW });

    expect(fresh[0].stale).toBe(false);
    expect(stale[0].stale).toBe(true);
  });

  it('flags never-hydrated cuttings as stale when max-age is set', () => {
    const cutting = structuredClone(debugFileCutting);
    cutting.facets = cutting.facets.map((f) => ({ ...f, lastHydrated: 0 }));
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(cutting) });

    const reports = status({ configPath: CONFIG_PATH, maxAgeSeconds: 999999, now: () => NOW });

    expect(reports[0].stale).toBe(true);
  });
});
