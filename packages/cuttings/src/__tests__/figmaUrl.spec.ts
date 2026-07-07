import { parseFigmaUrl } from '../figmaUrl';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

describe('@figmarine/cuttings - figmaUrl', () => {
  describe('parseFigmaUrl', () => {
    it('parses the Figma API debug file URL', () => {
      expect(
        parseFigmaUrl(
          'https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/Steve-s-Figma-API-debug-file?node-id=2-29975&p=f&t=FMV8kjiyTzFwlzs3-0',
        ),
      ).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
        name: 'Steve-s-Figma-API-debug-file',
        nodeId: '2:29975',
      });
    });

    it('parses the Error States file URL', () => {
      expect(
        parseFigmaUrl(
          'https://www.figma.com/design/3qv1uKfLSXm4etqj005Rmi/Error-States?node-id=207-48305&p=f&t=TtpPXnNOfDkekQuY-0',
        ),
      ).toStrictEqual({
        fileKey: '3qv1uKfLSXm4etqj005Rmi',
        name: 'Error-States',
        nodeId: '207:48305',
      });
    });

    it('parses the Surface new Stories file URL', () => {
      expect(
        parseFigmaUrl(
          'https://www.figma.com/design/pMmZ9LmqB0KbgI8GNY4IW9/Surface-new-Stories-2026?node-id=3-2192&p=f&t=KWLFyN6qTdmVpEpW-0',
        ),
      ).toStrictEqual({
        fileKey: 'pMmZ9LmqB0KbgI8GNY4IW9',
        name: 'Surface-new-Stories-2026',
        nodeId: '3:2192',
      });
    });

    it('normalises instance-path node ids with several dashes', () => {
      expect(
        parseFigmaUrl(
          'https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/Name?node-id=I2005-6797%3B2005-6798',
        ).nodeId,
      ).toBe('I2005:6797;2005:6798');
    });

    it('parses prototype URLs', () => {
      expect(
        parseFigmaUrl('https://www.figma.com/proto/idLa6ZCXDJUeRFI5wLVNWN/My-Proto?node-id=1-2'),
      ).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
        name: 'My-Proto',
        nodeId: '1:2',
      });
    });

    it('keeps undecodable name slugs raw instead of throwing', () => {
      expect(
        parseFigmaUrl('https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/100%-off').name,
      ).toBe('100%-off');
    });

    it('rejects branch URLs with an invalid branch key', () => {
      expect(() =>
        parseFigmaUrl('https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/branch/not%20a%20key/N'),
      ).toThrowError('not a Figma file URL');
    });

    it('parses URLs without a node id or name', () => {
      expect(parseFigmaUrl('https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN')).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
      });
    });

    it('parses legacy /file/ URLs', () => {
      expect(
        parseFigmaUrl('https://www.figma.com/file/idLa6ZCXDJUeRFI5wLVNWN/Some-Name'),
      ).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
        name: 'Some-Name',
      });
    });

    it('parses FigJam /board/ URLs', () => {
      expect(
        parseFigmaUrl('https://www.figma.com/board/idLa6ZCXDJUeRFI5wLVNWN/Some-Board'),
      ).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
        name: 'Some-Board',
      });
    });

    it('parses URLs without the www subdomain', () => {
      expect(parseFigmaUrl('https://figma.com/design/idLa6ZCXDJUeRFI5wLVNWN')).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
      });
    });

    it('resolves branch URLs to the branch key', () => {
      expect(
        parseFigmaUrl(
          'https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/branch/aBcD1234eFgH/Steve-s-Figma-API-debug-file',
        ),
      ).toStrictEqual({
        fileKey: 'aBcD1234eFgH',
        mainFileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
        name: 'Steve-s-Figma-API-debug-file',
      });
    });

    it('decodes percent-encoded file names', () => {
      expect(
        parseFigmaUrl('https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/D%C3%A9tresse'),
      ).toStrictEqual({
        fileKey: 'idLa6ZCXDJUeRFI5wLVNWN',
        name: 'Détresse',
      });
    });

    it('rejects non-URL input', () => {
      expect(() => parseFigmaUrl('idLa6ZCXDJUeRFI5wLVNWN')).toThrowError('not a valid URL');
    });

    it('rejects non-Figma hosts', () => {
      expect(() =>
        parseFigmaUrl('https://www.figma.com.evil.example/design/idLa6ZCXDJUeRFI5wLVNWN'),
      ).toThrowError('not a Figma URL');
    });

    it('rejects Figma URLs that do not point at files', () => {
      expect(() => parseFigmaUrl('https://www.figma.com/files/recents-and-sharing')).toThrowError(
        'not a Figma file URL',
      );
    });

    it('rejects file URLs with an invalid key', () => {
      expect(() => parseFigmaUrl('https://www.figma.com/design/no%20key%20here/Name')).toThrowError(
        'not a Figma file URL',
      );
    });
  });
});
