import type { ClientInterface } from '@figmarine/rest';
import { vol } from 'memfs';

import { debugFileConfig, debugFileCutting } from '../__fixtures__/cutting';
import { connectNursery } from '../connect';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

/* Cuttings mock: attaching and digging are exercised by the cuttings
 * package's own tests. */
const { mockedAttach, mockedDetach, mockedDig } = vi.hoisted(() => {
  const mockedDetach = vi.fn();
  return {
    mockedAttach: vi.fn(() => mockedDetach),
    mockedDetach,
    mockedDig: vi.fn(),
  };
});
vi.mock(import('@figmarine/cuttings'), async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, attachCuttings: mockedAttach, digCutting: mockedDig };
});

const CONFIG_PATH = '/repo/.figmarine/nursery.json';
const CUTTING_PATH = '/repo/.figmarine/cuttings/debug-file.cutting.figmarine.json';
const mockedClient = { v1: {} } as unknown as ClientInterface;

const twoCuttingsConfig = {
  cuttings: {
    ...debugFileConfig.cuttings,
    'error-states': {
      files: [{ url: 'https://www.figma.com/design/3qv1uKfLSXm4etqj005Rmi/Error-States' }],
    },
  },
};
const ERROR_STATES_PATH = '/repo/.figmarine/cuttings/error-states.cutting.figmarine.json';

describe('@figmarine/nursery - connectNursery', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      [CONFIG_PATH]: JSON.stringify(debugFileConfig),
      [CUTTING_PATH]: JSON.stringify(debugFileCutting),
    });
    mockedDig.mockReturnValue(structuredClone(debugFileCutting));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mockedAttach.mockClear();
    mockedDetach.mockClear();
    mockedDig.mockReset();
  });

  it('digs every configured cutting and attaches them to the client', () => {
    const connection = connectNursery(mockedClient, { configPath: CONFIG_PATH });

    expect(mockedDig).toHaveBeenCalledExactlyOnceWith(CUTTING_PATH);
    expect(mockedAttach).toHaveBeenCalledExactlyOnceWith(mockedClient, [
      expect.objectContaining({ meta: expect.objectContaining({ label: 'debug file' }) }),
    ]);
    expect(connection.locations).toStrictEqual([CUTTING_PATH]);
    expect(connection.cuttings).toHaveLength(1);
  });

  it('returns the detach function of the underlying attachment', () => {
    const connection = connectNursery(mockedClient, { configPath: CONFIG_PATH });

    expect(mockedDetach).not.toHaveBeenCalled();
    connection.disconnect();
    expect(mockedDetach).toHaveBeenCalledTimes(1);
  });

  it('only connects the named cuttings when names are given', () => {
    vol.fromJSON({
      [CONFIG_PATH]: JSON.stringify(twoCuttingsConfig),
      [ERROR_STATES_PATH]: JSON.stringify(debugFileCutting),
    });

    const connection = connectNursery(mockedClient, {
      configPath: CONFIG_PATH,
      names: ['error-states'],
    });

    expect(connection.locations).toStrictEqual([ERROR_STATES_PATH]);
    expect(mockedDig).toHaveBeenCalledExactlyOnceWith(ERROR_STATES_PATH);
  });

  it('throws when a selected cutting was never planted', () => {
    vol.fromJSON({ [CONFIG_PATH]: JSON.stringify(twoCuttingsConfig) });

    expect(() =>
      connectNursery(mockedClient, { configPath: CONFIG_PATH, names: ['error-states'] }),
    ).toThrowError(/'error-states' is not planted at .* Run 'nursery take error-states' first/);
    expect(mockedAttach).not.toHaveBeenCalled();
  });

  it('throws on unknown cutting names', () => {
    expect(() =>
      connectNursery(mockedClient, { configPath: CONFIG_PATH, names: ['nope'] }),
    ).toThrowError('no cuttings named: nope');
  });

  it('throws when there is no config file', () => {
    expect(() =>
      connectNursery(mockedClient, { configPath: '/nowhere/nursery.json' }),
    ).toThrowError(/no config found/);
    expect(mockedAttach).not.toHaveBeenCalled();
  });
});
