import { run } from '../cli';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

/* Command mocks: each command's behavior is covered by its own spec. */
const { mockedInit, mockedTakeCommand, mockedRefresh, mockedStatus } = vi.hoisted(() => ({
  mockedInit: vi.fn(),
  mockedTakeCommand: vi.fn(),
  mockedRefresh: vi.fn(),
  mockedStatus: vi.fn(),
}));
vi.mock(import('../commands/init'), async () => ({ init: mockedInit }));
vi.mock(import('../commands/take'), async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, takeCommand: mockedTakeCommand };
});
vi.mock(import('../commands/refresh'), async () => ({ refresh: mockedRefresh }));
vi.mock(import('../commands/status'), async () => ({ status: mockedStatus }));

describe('@figmarine/nursery - cli', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedInit.mockReturnValue('my-cutting');
    mockedTakeCommand.mockResolvedValue(['/planted.json']);
    mockedRefresh.mockResolvedValue(['/planted.json']);
    mockedStatus.mockReturnValue([]);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    mockedInit.mockReset();
    mockedTakeCommand.mockReset();
    mockedRefresh.mockReset();
    mockedStatus.mockReset();
  });

  it('prints usage and fails when no command is given', async () => {
    expect(await run([])).toBe(2);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: nursery'));
  });

  it('prints usage and succeeds on --help', async () => {
    expect(await run(['--help'])).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: nursery'));
  });

  it('rejects unknown commands', async () => {
    expect(await run(['prune'])).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown command 'prune'"));
  });

  it('rejects unknown options', async () => {
    expect(await run(['take', '--frobnicate'])).toBe(2);
  });

  it('dispatches init with URLs, name and config path', async () => {
    const code = await run([
      'init',
      'https://figma.com/design/abc/X',
      '-n',
      'x',
      '-c',
      '/cfg.json',
    ]);

    expect(code).toBe(0);
    expect(mockedInit).toHaveBeenCalledExactlyOnceWith({
      urls: ['https://figma.com/design/abc/X'],
      name: 'x',
      configPath: '/cfg.json',
    });
  });

  it('dispatches take with names', async () => {
    const code = await run(['take', 'a', 'b']);

    expect(code).toBe(0);
    expect(mockedTakeCommand).toHaveBeenCalledExactlyOnceWith({
      names: ['a', 'b'],
      configPath: undefined,
      onProgress: expect.any(Function),
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Planted /planted.json'));
  });

  it('dispatches refresh', async () => {
    const code = await run(['refresh']);

    expect(code).toBe(0);
    expect(mockedRefresh).toHaveBeenCalledExactlyOnceWith({
      names: [],
      configPath: undefined,
      onProgress: expect.any(Function),
    });
  });

  it('dispatches status and succeeds when nothing is stale', async () => {
    mockedStatus.mockReturnValue([
      {
        name: 'a',
        location: '/a.json',
        planted: true,
        facetCount: 1,
        oldestHydration: 5,
        stale: false,
      },
    ]);

    const code = await run(['status']);

    expect(code).toBe(0);
    expect(mockedStatus).toHaveBeenCalledExactlyOnceWith({
      names: [],
      configPath: undefined,
      maxAgeSeconds: undefined,
    });
  });

  it('exits 1 when a cutting is stale', async () => {
    mockedStatus.mockReturnValue([{ name: 'a', location: '/a.json', planted: false, stale: true }]);

    expect(await run(['status', '--max-age', '3600'])).toBe(1);
    expect(mockedStatus).toHaveBeenCalledWith(expect.objectContaining({ maxAgeSeconds: 3600 }));
  });

  it('rejects a non-numeric --max-age with usage and exit code 2', async () => {
    expect(await run(['status', '--max-age', '1d'])).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid --max-age value '1d'"));
    expect(mockedStatus).not.toHaveBeenCalled();
  });

  it('rejects a negative --max-age', async () => {
    expect(await run(['status', '--max-age', '-5'])).toBe(2);
    expect(mockedStatus).not.toHaveBeenCalled();
  });

  it('reports command failures on stderr with exit code 1', async () => {
    mockedTakeCommand.mockRejectedValue(new Error('no token'));

    expect(await run(['take'])).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith('no token');
  });
});
