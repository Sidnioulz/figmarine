import type { V1 } from '@figmarine/rest';

import { loadApiFixture } from '../__fixtures__/api';
import { slimFile } from '../slim';

describe('@figmarine/cuttings - slim', () => {
  describe('slimFile', () => {
    const body = loadApiFixture<V1.GetFile.ResponseBody>('figma-api-debug-file', 'GetFile');

    it('keeps the fields needed for offline analysis', () => {
      const slim = slimFile(body);

      expect(slim.name).toBe(body.name);
      expect(slim.lastModified).toBe(body.lastModified);
      expect(slim.editorType).toBe(body.editorType);
      expect(slim.version).toBe(body.version);
      expect(slim.schemaVersion).toBe(body.schemaVersion);
      expect(slim.document).toStrictEqual(body.document);
      expect(slim.components).toStrictEqual(body.components);
      expect(slim.componentSets).toStrictEqual(body.componentSets);
      expect(slim.styles).toStrictEqual(body.styles);
    });

    it('drops volatile and access-related fields', () => {
      const slim = slimFile(body) as Record<string, unknown>;

      expect(slim.thumbnailUrl).toBeUndefined();
      expect(slim.role).toBeUndefined();
      expect(slim.linkAccess).toBeUndefined();
    });

    it('omits optional fields that the response does not contain', () => {
      const { branches: _branches, ...withoutBranches } = body;
      const slim = slimFile(withoutBranches as V1.GetFile.ResponseBody);

      expect('branches' in slim).toBe(false);
    });

    it('round-trips through JSON without loss', () => {
      const slim = slimFile(body);

      expect(JSON.parse(JSON.stringify(slim))).toStrictEqual(slim);
    });
  });
});
