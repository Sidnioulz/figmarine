import * as constants from '../constants';

describe('@figmarine/cache - constants', () => {
  describe('DEFAULT_CACHE_PATH', () => {
    it('exports DEFAULT_CACHE_PATH', () => {
      expect(constants).toHaveProperty('DEFAULT_CACHE_PATH');
    });
    it('scopes cache content with the package name', () => {
      expect(constants.DEFAULT_CACHE_PATH.startsWith('/tmp/@figmarine')).toBeTruthy();
    });
  });
  describe('YEAR_IN_SECONDS', () => {
    it('exports YEAR_IN_SECONDS', () => {
      expect(constants).toHaveProperty('YEAR_IN_SECONDS');
    });
    it('returns YEAR_IN_SECONDS as a number', () => {
      expect(typeof constants.YEAR_IN_SECONDS).toBe('number');
    });
  });
});
