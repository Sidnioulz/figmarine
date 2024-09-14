import path from 'node:path';

import { test as base } from 'vitest';
import { vol } from 'memfs';

import { digCutting, plantCutting } from '../fs';
import type { Cutting } from '../schemas/cutting';
import { fileBasic } from '../__fixtures__/cuttings';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

/* Connect fixtures to context. */
interface CuttingFsFixtures {
  fileBasic: Cutting;
  fileBasicLocation: string;
}
const it = base.extend<CuttingFsFixtures>({
  fileBasic: async ({}, use) => {
    const sample = structuredClone(fileBasic);
    await use(sample);
  },
  fileBasicLocation: '/a/good/spot/with/shade/basic.cutting.figmarine.json',
});

/* Test utils. */
const stripFsMeta = (c: Cutting) => {
  const { lastKnownFilePath: _, lastStored: __, ...strippedMeta } = c.meta;

  return {
    ...c,
    meta: strippedMeta,
  };
};

/* Run tests. */
describe('@figmarine/cuttings - fs', () => {
  beforeEach(() => {
    vol.reset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('plantCutting', () => {
    it('saves a cutting where instructed', ({ fileBasic, fileBasicLocation }) => {
      vol.fromJSON({
        [path.dirname(fileBasicLocation)]: null,
      });

      plantCutting(fileBasic, fileBasicLocation);

      const written = vol.readFileSync(fileBasicLocation, 'utf8');
      expect(written).toBeDefined();
      expect(written).toContain(`"label":"${fileBasic.meta.label}"`);
    });

    it('creates the folders where to write if required, and warns about it', ({
      fileBasic,
      fileBasicLocation,
    }) => {
      plantCutting(fileBasic, fileBasicLocation);

      const written = vol.readFileSync(fileBasicLocation, 'utf8');
      expect(written).toBeDefined();
      expect(written).toContain(`"label":"${fileBasic.meta.label}"`);
      expect(mockedLog).toHaveBeenCalledWith(
        expect.stringMatching(/directory .* does not exist, attempting to create/),
      );
    });

    it('overwrites cuttings if required, and warns about it', ({
      fileBasic,
      fileBasicLocation,
    }) => {
      const priorFileContent = 'Something else entirely.';
      vol.fromJSON({
        [fileBasicLocation]: priorFileContent,
      });

      plantCutting(fileBasic, fileBasicLocation);

      const written = vol.readFileSync(fileBasicLocation, 'utf8');
      expect(written).toBeDefined();
      expect(written).not.toBe(priorFileContent);
      expect(written).toContain(`"label":"${fileBasic.meta.label}"`);
      expect(mockedLog).toHaveBeenCalledWith(expect.stringMatching(/overwriting existing file/));
    });

    it('does not write `lastKnownFilePath` to a stored cutting', ({
      fileBasic,
      fileBasicLocation,
    }) => {
      plantCutting(fileBasic, fileBasicLocation);
      const written = vol.readFileSync(fileBasicLocation, 'utf8');
      const writtenParsed = JSON.parse(written.toString());

      expect(fileBasic.meta.lastKnownFilePath).toBeDefined();
      expect(writtenParsed.meta.lastKnownFilePath).toBeUndefined();
    });

    it('writes `lastStored` date to a stored cutting', ({ fileBasic, fileBasicLocation }) => {
      vi.useFakeTimers();
      vi.setSystemTime(842900000);

      plantCutting(fileBasic, fileBasicLocation);
      const written = vol.readFileSync(fileBasicLocation, 'utf8');
      const writtenParsed = JSON.parse(written.toString());
      vi.runAllTimers();

      expect(fileBasic.meta.lastStored).not.toBe(writtenParsed.meta.lastStored);
      expect(writtenParsed.meta.lastStored).toBe(842900000);

      vi.useRealTimers();
    });

    it('saves the cutting content correctly aside from fs-related metadata', ({
      fileBasic,
      fileBasicLocation,
    }) => {
      plantCutting(fileBasic, fileBasicLocation);
      const written = vol.readFileSync(fileBasicLocation, 'utf8');
      const writtenParsed = JSON.parse(written.toString());

      expect(stripFsMeta(writtenParsed)).toMatchObject(stripFsMeta(fileBasic));
    });
  });

  describe('digCutting', () => {
    it('digs a cutting from its location', ({ fileBasic }) => {
      const someLocation = '/a/random/location/somewhere.cutting.figmarine.json';
      vol.fromJSON({ [someLocation]: JSON.stringify(fileBasic) });

      expect(stripFsMeta(digCutting(someLocation))).toMatchObject(stripFsMeta(fileBasic));
    });

    it('has the lastKnownLocation match where the file was picked up', ({
      fileBasic,
      fileBasicLocation,
    }) => {
      vol.fromJSON({ [fileBasicLocation]: JSON.stringify(fileBasic) });

      expect(digCutting(fileBasicLocation).meta.lastKnownFilePath).toBe(fileBasicLocation);
    });

    it('does not touch the lastStored variable (matches time of writing)', ({
      fileBasic,
      fileBasicLocation,
    }) => {
      vol.fromJSON({ [fileBasicLocation]: JSON.stringify(fileBasic) });
      vi.useFakeTimers();
      vi.setSystemTime(842900000);

      const dug = digCutting(fileBasicLocation);
      vi.runAllTimers();

      expect(dug.meta.lastStored).not.toBe(842900000);
      expect(dug.meta.lastStored).toBe(fileBasic.meta.lastStored);

      vi.useRealTimers();
    });

    it('fails if the location was empty', () => {
      expect(() =>
        digCutting('/an/empty/location/devoidOfContent.cutting.figmarine.json'),
      ).toThrowError('no such file or directory');
    });

    it('fails if the location contained non-JSON content', ({ fileBasicLocation }) => {
      vol.fromJSON({ [fileBasicLocation]: 'A poetry essay about parrots' });
      expect(() => digCutting(fileBasicLocation)).toThrowError('is not valid JSON');
    });

    it('fails if the location contained something else altogether', ({ fileBasicLocation }) => {
      vol.fromJSON({ [fileBasicLocation]: '{"name":"McParrot","isBird":true}' });
      expect(() => digCutting(fileBasicLocation)).toThrowError(
        'File did not match expected format',
      );
    });
  });

  describe('chaining', () => {
    it('plant ➔ dig works', ({ fileBasic, fileBasicLocation }) => {
      plantCutting(fileBasic, fileBasicLocation);
      const dugBackUp = digCutting(fileBasicLocation);

      expect(stripFsMeta(dugBackUp)).toMatchObject(stripFsMeta(fileBasic));
    });

    it('dig ➔ plant works', ({ fileBasic, fileBasicLocation }) => {
      vol.fromJSON({ [fileBasicLocation]: JSON.stringify(fileBasic) });

      plantCutting(digCutting(fileBasicLocation), fileBasicLocation);
      const plantedBackIn = vol.readFileSync(fileBasicLocation, 'utf8');

      expect(stripFsMeta(JSON.parse(plantedBackIn.toString()))).toMatchObject(
        stripFsMeta(fileBasic),
      );
    });
  });
});
