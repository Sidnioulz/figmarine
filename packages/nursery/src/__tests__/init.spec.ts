import { vol } from 'memfs';

import { init } from '../commands/init';
import { loadConfig } from '../config';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

const DEBUG_FILE_URL =
  'https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/Steve-s-Figma-API-debug-file?node-id=2-29975';
const ERROR_STATES_URL =
  'https://www.figma.com/design/3qv1uKfLSXm4etqj005Rmi/Error-States?node-id=207-48305';
const CONFIG_PATH = '/repo/.figmarine/nursery.json';

describe('@figmarine/nursery - init', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ '/repo': null });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a config with a cutting entry named after the file', () => {
    const name = init({ urls: [DEBUG_FILE_URL], configPath: CONFIG_PATH });

    expect(name).toBe('steve-s-figma-api-debug-file');

    const config = loadConfig(CONFIG_PATH);
    expect(config.cuttings[name].files).toHaveLength(1);
    expect(config.cuttings[name].files[0].url).toBe(DEBUG_FILE_URL);
    expect(config.cuttings[name].files[0].endpoints).toStrictEqual([
      'GetFile',
      'GetFileComponents',
      'GetFileComponentSets',
      'GetFileStyles',
    ]);
  });

  it('uses the provided name when given', () => {
    const name = init({ urls: [DEBUG_FILE_URL], name: 'debug', configPath: CONFIG_PATH });

    expect(name).toBe('debug');
    expect(loadConfig(CONFIG_PATH).cuttings.debug).toBeDefined();
  });

  it('groups several URLs into one cutting', () => {
    const name = init({
      urls: [DEBUG_FILE_URL, ERROR_STATES_URL],
      name: 'both',
      configPath: CONFIG_PATH,
    });

    expect(loadConfig(CONFIG_PATH).cuttings[name].files).toHaveLength(2);
  });

  it('appends to an existing config', () => {
    init({ urls: [DEBUG_FILE_URL], name: 'first', configPath: CONFIG_PATH });
    init({ urls: [ERROR_STATES_URL], name: 'second', configPath: CONFIG_PATH });

    const config = loadConfig(CONFIG_PATH);
    expect(Object.keys(config.cuttings).sort()).toStrictEqual(['first', 'second']);
  });

  it('refuses to overwrite an existing entry', () => {
    init({ urls: [DEBUG_FILE_URL], name: 'dupe', configPath: CONFIG_PATH });

    expect(() =>
      init({ urls: [ERROR_STATES_URL], name: 'dupe', configPath: CONFIG_PATH }),
    ).toThrowError('already exists');
  });

  it('rejects invalid URLs without touching the config', () => {
    expect(() =>
      init({ urls: [DEBUG_FILE_URL, 'https://example.com/nope'], configPath: CONFIG_PATH }),
    ).toThrowError('not a Figma URL');

    expect(vol.existsSync(CONFIG_PATH)).toBe(false);
  });

  it('requires at least one URL', () => {
    expect(() => init({ urls: [], configPath: CONFIG_PATH })).toThrowError('at least one');
  });
});
