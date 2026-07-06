import { facetsMatch, planFacets } from '../plan';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

const DEBUG_FILE_URL =
  'https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/Steve-s-Figma-API-debug-file?node-id=2-29975';
const ERROR_STATES_URL =
  'https://www.figma.com/design/3qv1uKfLSXm4etqj005Rmi/Error-States?node-id=207-48305';

describe('@figmarine/nursery - plan', () => {
  describe('planFacets', () => {
    it('derives one facet per file and endpoint', () => {
      const facets = planFacets({
        files: [
          { url: DEBUG_FILE_URL, endpoints: ['GetFile', 'GetFileStyles'] },
          { url: ERROR_STATES_URL, endpoints: ['GetFile'] },
        ],
      });

      expect(facets).toStrictEqual([
        { endpoint: 'GetFile', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
        { endpoint: 'GetFileStyles', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
        { endpoint: 'GetFile', id: '3qv1uKfLSXm4etqj005Rmi' },
      ]);
    });

    it('deduplicates facets when URLs resolve to the same file', () => {
      const facets = planFacets({
        files: [
          { url: DEBUG_FILE_URL, endpoints: ['GetFile'] },
          { url: `${DEBUG_FILE_URL}&t=whatever`, endpoints: ['GetFile', 'GetFileStyles'] },
        ],
      });

      expect(facets).toStrictEqual([
        { endpoint: 'GetFile', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
        { endpoint: 'GetFileStyles', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
      ]);
    });

    it('pins the GetFile facet to the configured version', () => {
      const facets = planFacets({
        files: [{ url: DEBUG_FILE_URL, endpoints: ['GetFile', 'GetFileStyles'], version: '42' }],
      });

      expect(facets).toStrictEqual([
        { endpoint: 'GetFile', id: 'idLa6ZCXDJUeRFI5wLVNWN', version: '42' },
        { endpoint: 'GetFileStyles', id: 'idLa6ZCXDJUeRFI5wLVNWN' },
      ]);
    });

    it('throws on invalid Figma URLs', () => {
      expect(() =>
        planFacets({ files: [{ url: 'https://example.com/nope', endpoints: ['GetFile'] }] }),
      ).toThrowError('not a Figma URL');
    });
  });

  describe('facetsMatch', () => {
    it('matches identical facet sets regardless of order and hydration', () => {
      expect(
        facetsMatch(
          [
            { endpoint: 'GetFile', id: 'abc' },
            { endpoint: 'GetFileStyles', id: 'abc' },
          ],
          [
            { endpoint: 'GetFileStyles', id: 'abc', lastHydrated: 123 },
            { endpoint: 'GetFile', id: 'abc', lastHydrated: 456 },
          ],
        ),
      ).toBe(true);
    });

    it('detects added facets', () => {
      expect(
        facetsMatch(
          [
            { endpoint: 'GetFile', id: 'abc' },
            { endpoint: 'GetFileStyles', id: 'abc' },
          ],
          [{ endpoint: 'GetFile', id: 'abc' }],
        ),
      ).toBe(false);
    });

    it('detects version changes on versioned facets', () => {
      expect(
        facetsMatch(
          [{ endpoint: 'GetFile', id: 'abc', version: '2' }],
          [{ endpoint: 'GetFile', id: 'abc', version: '1' }],
        ),
      ).toBe(false);
    });
  });
});
