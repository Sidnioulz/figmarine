import { test as base } from 'vitest';
import { vol } from 'memfs';

import { type Cutting, CuttingSchema } from '../schemas/cutting';
import { fileBasic, unlabeled, unstoredAndUnlabeled } from '../__fixtures__/cuttings';
import { printCutting, printFacet, printFacets, printZodError } from '../logHelpers';

/* FS mocks. */
vi.mock('node:fs');
vi.mock('node:fs/promises');

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

/* Connect fixtures to context. */
interface CuttingFsFixtures {
  fileBasic: Cutting;
  unlabeled: Cutting;
  unstoredAndUnlabeled: Cutting;
}
const it = base.extend<CuttingFsFixtures>({
  fileBasic: async ({}, use) => {
    await use(structuredClone(fileBasic));
  },
  unlabeled: async ({}, use) => {
    await use(structuredClone(unlabeled));
  },
  unstoredAndUnlabeled: async ({}, use) => {
    await use(structuredClone(unstoredAndUnlabeled));
  },
});

/* Run tests. */
describe('@figmarine/cuttings - logHelpers', () => {
  beforeEach(() => {
    vol.reset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('printCutting', () => {
    it('prints a cutting from the label first', ({ fileBasic }) => {
      expect(printCutting(fileBasic)).toBe(fileBasic.meta.label);
    });
    it('prints a cutting from the last known location then', ({ unlabeled }) => {
      expect(printCutting(unlabeled)).toBe(unlabeled.meta.lastKnownFilePath);
    });
    it('resorts to <unnamed> for cuttings without identifiable information', ({
      unstoredAndUnlabeled,
    }) => {
      expect(printCutting(unstoredAndUnlabeled)).toBe('<unnamed>');
    });
  });

  describe('printFacet', () => {
    it('prints a facet using its endpoint name and id of the data to fetch', ({ fileBasic }) => {
      const f = fileBasic.facets[0];
      expect(printFacet(f)).toContain(f.endpoint);
      expect(printFacet(f)).toContain(f.id);
    });
  });

  describe('printFacets', () => {
    it('prints all facets in order', ({ fileBasic }) => {
      const f0 = printFacet(fileBasic.facets[0]);
      const f1 = printFacet(fileBasic.facets[1]);
      const allFacets = printFacets(fileBasic);

      expect(allFacets).toContain(f0);
      expect(allFacets).toContain(f1);
      expect(allFacets.indexOf(f0)).toBeLessThan(allFacets.indexOf(f1));
    });
  });

  describe('printZodError', () => {
    it('prints one line per issue with its path', () => {
      const outcome = CuttingSchema.safeParse({ meta: {}, facets: 'not-an-array' });
      expect(outcome.success).toBe(false);

      const printed = printZodError(outcome.error!);
      const lines = printed.split('\n');

      expect(lines.length).toBe(outcome.error!.issues.length);
      expect(printed).toContain('meta.lastStored');
      expect(printed).toContain('facets');
    });

    it('labels issues without a path as <root>', () => {
      const outcome = CuttingSchema.safeParse('not even an object');
      expect(outcome.success).toBe(false);

      expect(printZodError(outcome.error!)).toContain('<root>');
    });
  });
});
