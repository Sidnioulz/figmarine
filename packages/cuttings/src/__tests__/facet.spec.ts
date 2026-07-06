import { isFacet } from '../schemas/facet';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

describe('@figmarine/cuttings - facet', () => {
  describe('isFacet', () => {
    it('accepts a basic facet', () => {
      expect(isFacet({ endpoint: 'GetFileStyles', id: 'abc123' })).toBe(true);
    });

    it('accepts a versioned facet with hydration metadata', () => {
      expect(
        isFacet({ endpoint: 'GetFile', id: 'abc123', version: '42', lastHydrated: 123456 }),
      ).toBe(true);
    });

    it('tolerates unknown extra fields for forward compatibility', () => {
      expect(isFacet({ endpoint: 'GetFileStyles', id: 'abc123', version: '42' })).toBe(true);
    });

    it('rejects unknown endpoints', () => {
      expect(isFacet({ endpoint: 'GetTeams', id: 'abc123' })).toBe(false);
    });

    it('rejects facets without an id', () => {
      expect(isFacet({ endpoint: 'GetFile' })).toBe(false);
    });

    it('rejects non-object blobs', () => {
      expect(isFacet('GetFile:abc123')).toBe(false);
      expect(isFacet(null)).toBe(false);
    });
  });
});
