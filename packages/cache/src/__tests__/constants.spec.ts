import * as constants from '../constants';

describe('constants', () => {
  describe('cachePath', () => {
    it('exports cachePath', () => {
      expect(constants).toHaveProperty('cachePath');
    });
    it('scopes cache content with the package name', () => {
      expect(constants.cachePath.startsWith('/tmp/@figmarine')).toBeTruthy();
    });
  });
});
