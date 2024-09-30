import { get429Config, getConfig } from '../rateLimit.config';

describe('@figmarine/rest - rateLimit.config', () => {
  describe('get429Config', () => {
    it('returns all the expected keys', () => {
      const cfg = get429Config();
      expect(cfg).toMatchObject({
        INITIAL_DELAY: expect.any(Number),
      });
    });
  });

  describe('getConfig', () => {
    it('returns all the expected keys', () => {
      const cfg = getConfig();
      expect(cfg).toMatchObject({
        reqLog: expect.any(Array),
        WINDOW_BUDGET: expect.any(Number),
        WINDOW_LENGTH: expect.any(Number),
      });
    });
  });
});
