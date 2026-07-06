import type { ClientInterface } from '@figmarine/rest';
import { vol } from 'memfs';

import { debugFileConfig, debugFileCutting } from '../__fixtures__/cutting';
import { takeCommand } from '../commands/take';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

/* Cuttings mock: take is exercised by the cuttings package's own tests. */
const { mockedTake } = vi.hoisted(() => ({ mockedTake: vi.fn() }));
vi.mock(import('@figmarine/cuttings'), async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, take: mockedTake };
});

const CONFIG_PATH = '/repo/.figmarine/nursery.json';
const mockedClient = { v1: {} } as unknown as ClientInterface;
const clientFactory = vi.fn(async () => mockedClient);

describe('@figmarine/nursery - take command', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ [CONFIG_PATH]: JSON.stringify(debugFileConfig) });
    mockedTake.mockResolvedValue(structuredClone(debugFileCutting));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mockedTake.mockReset();
    clientFactory.mockClear();
  });

  it('takes and plants every configured cutting', async () => {
    const planted = await takeCommand({ configPath: CONFIG_PATH, clientFactory });

    expect(planted).toStrictEqual(['/repo/.figmarine/cuttings/debug-file.cutting.figmarine.json']);
    expect(mockedTake).toHaveBeenCalledExactlyOnceWith({
      client: mockedClient,
      label: 'debug file',
      facets: [
        { endpoint: 'GetFile', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
        { endpoint: 'GetFileStyles', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
      ],
    });

    const written = vol.readFileSync(planted[0], 'utf-8') as string;
    expect(JSON.parse(written).meta.label).toBe('debug file');
  });

  it('falls back to the entry name when there is no label', async () => {
    const config = structuredClone(debugFileConfig);
    delete (config.cuttings['debug-file'] as { label?: string }).label;
    vol.reset();
    vol.fromJSON({ [CONFIG_PATH]: JSON.stringify(config) });

    await takeCommand({ configPath: CONFIG_PATH, clientFactory });

    expect(mockedTake).toHaveBeenCalledWith(expect.objectContaining({ label: 'debug-file' }));
  });

  it('only takes the requested cuttings', async () => {
    await takeCommand({ names: ['debug-file'], configPath: CONFIG_PATH, clientFactory });

    expect(mockedTake).toHaveBeenCalledTimes(1);
  });

  it('throws on unknown cutting names', async () => {
    await expect(() =>
      takeCommand({ names: ['nope'], configPath: CONFIG_PATH, clientFactory }),
    ).rejects.toThrowError('no cuttings named: nope');

    expect(mockedTake).not.toHaveBeenCalled();
  });

  it('throws when the config has no cuttings', async () => {
    vol.reset();
    vol.fromJSON({ [CONFIG_PATH]: JSON.stringify({ cuttings: {} }) });

    await expect(() =>
      takeCommand({ configPath: CONFIG_PATH, clientFactory }),
    ).rejects.toThrowError('no cuttings configured');
  });
});
