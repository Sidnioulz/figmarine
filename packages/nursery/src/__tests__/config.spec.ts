import { vol } from 'memfs';

import {
  cuttingPath,
  loadConfig,
  NurseryConfigSchema,
  saveConfig,
  selectCuttings,
} from '../config';
import { debugFileConfig } from '../__fixtures__/cutting';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

describe('@figmarine/nursery - config', () => {
  beforeEach(() => {
    vol.reset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('NurseryConfigSchema', () => {
    it('applies defaults for output and endpoints', () => {
      const parsed = NurseryConfigSchema.parse({
        cuttings: {
          minimal: { files: [{ url: 'https://www.figma.com/design/abc123/Name' }] },
        },
      });

      expect(parsed.output).toBe('cuttings');
      expect(parsed.cuttings.minimal.files[0].endpoints).toStrictEqual([
        'GetFile',
        'GetFileComponents',
        'GetFileComponentSets',
        'GetFileStyles',
      ]);
    });

    it('rejects cuttings without files', () => {
      const outcome = NurseryConfigSchema.safeParse({
        cuttings: { broken: { files: [] } },
      });

      expect(outcome.success).toBe(false);
    });

    it('rejects unknown endpoint types', () => {
      const outcome = NurseryConfigSchema.safeParse({
        cuttings: {
          broken: {
            files: [{ url: 'https://www.figma.com/design/abc123/Name', endpoints: ['GetTeams'] }],
          },
        },
      });

      expect(outcome.success).toBe(false);
    });
  });

  describe('loadConfig / saveConfig', () => {
    it('round-trips a config through disk', () => {
      vol.fromJSON({ '/repo': null });

      saveConfig(debugFileConfig, '/repo/.figmarine/nursery.json');
      const loaded = loadConfig('/repo/.figmarine/nursery.json');

      expect(loaded.cuttings['debug-file'].label).toBe('debug file');
      expect(loaded.output).toBe('/repo/.figmarine/cuttings');
    });

    it('resolves a relative output against the config directory', () => {
      vol.fromJSON({ '/repo': null });

      saveConfig({ ...debugFileConfig, output: 'snapshots' }, '/repo/.figmarine/nursery.json');

      expect(loadConfig('/repo/.figmarine/nursery.json').output).toBe('/repo/.figmarine/snapshots');
    });

    it('keeps an absolute output as is', () => {
      vol.fromJSON({ '/repo': null });

      saveConfig({ ...debugFileConfig, output: '/var/cuttings' }, '/repo/.figmarine/nursery.json');

      expect(loadConfig('/repo/.figmarine/nursery.json').output).toBe('/var/cuttings');
    });

    it('pretty-prints the config file', () => {
      vol.fromJSON({ '/repo': null });

      saveConfig(debugFileConfig, '/repo/.figmarine/nursery.json');

      const written = vol.readFileSync('/repo/.figmarine/nursery.json', 'utf-8');
      expect(written).toContain('  "cuttings": {');
    });

    it('throws a helpful error when the config is missing', () => {
      expect(() => loadConfig('/repo/.figmarine/nursery.json')).toThrowError('nursery init');
    });

    it('throws when the config is not valid JSON', () => {
      vol.fromJSON({ '/repo/.figmarine/nursery.json': 'not json' });

      expect(() => loadConfig('/repo/.figmarine/nursery.json')).toThrowError('could not parse');
    });

    it('throws with issue details when the config does not match the schema', () => {
      vol.fromJSON({
        '/repo/.figmarine/nursery.json': JSON.stringify({ cuttings: { broken: { files: [] } } }),
      });

      expect(() => loadConfig('/repo/.figmarine/nursery.json')).toThrowError(
        /invalid config[\s\S]*cuttings\.broken\.files/,
      );
    });
  });

  describe('cuttingPath', () => {
    it('plants cuttings in the configured output directory', () => {
      const config = NurseryConfigSchema.parse(debugFileConfig);

      expect(cuttingPath(config, 'debug-file')).toBe('cuttings/debug-file.cutting.figmarine.json');
    });
  });

  describe('selectCuttings', () => {
    const resolved = () => NurseryConfigSchema.parse(debugFileConfig);

    it('selects everything when no names are passed', () => {
      expect(selectCuttings(resolved(), undefined, 'cfg').map(([n]) => n)).toStrictEqual([
        'debug-file',
      ]);
      expect(selectCuttings(resolved(), [], 'cfg')).toHaveLength(1);
    });

    it('selects by name', () => {
      expect(selectCuttings(resolved(), ['debug-file'], 'cfg')).toHaveLength(1);
    });

    it('throws on unknown names', () => {
      expect(() => selectCuttings(resolved(), ['nope'], 'cfg')).toThrowError(
        'no cuttings named: nope',
      );
    });

    it('throws when the config has no cuttings', () => {
      const empty = NurseryConfigSchema.parse({ cuttings: {} });

      expect(() => selectCuttings(empty, undefined, 'cfg')).toThrowError('no cuttings configured');
    });
  });
});
