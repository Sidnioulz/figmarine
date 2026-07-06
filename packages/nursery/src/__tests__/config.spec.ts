import { vol } from 'memfs';

import { cuttingPath, loadConfig, NurseryConfigSchema, saveConfig } from '../config';
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

      expect(parsed.output).toBe('.figmarine/cuttings');
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
      expect(loaded.output).toBe('.figmarine/cuttings');
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

      expect(cuttingPath(config, 'debug-file')).toBe(
        '.figmarine/cuttings/debug-file.cutting.figmarine.json',
      );
    });
  });
});
