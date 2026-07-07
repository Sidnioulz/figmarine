import type { ClientInterface } from '@figmarine/rest';
import { vol } from 'memfs';

import { debugFileConfig, debugFileCutting } from '../__fixtures__/cutting';
import { refresh } from '../commands/refresh';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

/* Cuttings mock: take/hydrate are exercised by the cuttings package's own tests. */
const { mockedTake, mockedHydrate } = vi.hoisted(() => ({
  mockedTake: vi.fn(),
  mockedHydrate: vi.fn(),
}));
vi.mock(import('@figmarine/cuttings'), async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, take: mockedTake, hydrate: mockedHydrate };
});

const CONFIG_PATH = '/repo/.figmarine/nursery.json';
const CUTTING_PATH = '/repo/.figmarine/cuttings/debug-file.cutting.figmarine.json';
const mockedClient = { v1: {} } as unknown as ClientInterface;
const clientFactory = vi.fn(async () => mockedClient);

describe('@figmarine/nursery - refresh command', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ [CONFIG_PATH]: JSON.stringify(debugFileConfig) });
    mockedTake.mockResolvedValue(structuredClone(debugFileCutting));
    mockedHydrate.mockResolvedValue(structuredClone(debugFileCutting));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mockedTake.mockReset();
    mockedHydrate.mockReset();
    clientFactory.mockClear();
  });

  it('takes cuttings that were never planted', async () => {
    const planted = await refresh({ configPath: CONFIG_PATH, clientFactory });

    expect(planted).toStrictEqual([CUTTING_PATH]);
    expect(mockedTake).toHaveBeenCalledTimes(1);
    expect(mockedHydrate).not.toHaveBeenCalled();
  });

  it('re-hydrates planted cuttings whose facets still match the config', async () => {
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(debugFileCutting) });

    await refresh({ configPath: CONFIG_PATH, clientFactory });

    expect(mockedHydrate).toHaveBeenCalledTimes(1);
    expect(mockedTake).not.toHaveBeenCalled();

    const arg = mockedHydrate.mock.calls[0][0];
    expect(arg.client).toBe(mockedClient);
    expect(arg.cutting.meta.label).toBe('debug file');
  });

  it('re-takes planted cuttings when the config facets changed', async () => {
    const staleCutting = structuredClone(debugFileCutting);
    // The planted cutting only knows about GetFile; config also wants styles.
    staleCutting.facets = [staleCutting.facets[0]];
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(staleCutting) });

    await refresh({ configPath: CONFIG_PATH, clientFactory });

    expect(mockedTake).toHaveBeenCalledTimes(1);
    expect(mockedHydrate).not.toHaveBeenCalled();
  });

  it('replants the refreshed cutting', async () => {
    vol.fromJSON({ [CUTTING_PATH]: JSON.stringify(debugFileCutting) });
    const fresher = structuredClone(debugFileCutting);
    fresher.data.files.idLa6ZCXDJUeRFI5wLVNWN.version = '2';
    mockedHydrate.mockResolvedValue(fresher);

    await refresh({ configPath: CONFIG_PATH, clientFactory });

    const written = JSON.parse(vol.readFileSync(CUTTING_PATH, 'utf-8') as string);
    expect(written.data.files.idLa6ZCXDJUeRFI5wLVNWN.version).toBe('2');
  });

  it('throws on unknown cutting names', async () => {
    await expect(() =>
      refresh({ names: ['nope'], configPath: CONFIG_PATH, clientFactory }),
    ).rejects.toThrowError('no cuttings named: nope');
  });
});
