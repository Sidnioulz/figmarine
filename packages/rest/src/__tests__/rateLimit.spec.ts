import { interceptRequest } from '../rateLimit';
import type { Log } from '../rateLimit.config';

const {
  mockedConfig,
  mockedConfigActualImplementation,
} = vi.hoisted(() => {
  return {
    mockedConfig: vi.fn(),
    mockedConfigActualImplementation: vi.fn(),
  }
})

vi.mock(import('../rateLimit.config'), async (importOriginal) => {
  const mod = await importOriginal();

  mockedConfigActualImplementation.mockImplementation(mod.getConfig);
  return {
    ...mod,
    getConfig: mockedConfig,
  }
});

describe('@figmarine/rest - rateLimit', () => {
  describe('interceptRequest', () => {

    beforeEach(async () => {
      vi.useFakeTimers()
      vi.setSystemTime(609401000)
      vi.spyOn(global, 'setTimeout');
      mockedConfig.mockImplementation(mockedConfigActualImplementation);
    })
    afterEach(() => {
      vi.restoreAllMocks();
    })

    it('does not wait when the rate limiting request log is empty', async () => {
      await interceptRequest(1);
      vi.runAllTimers();
      expect(mockedConfig).toHaveBeenCalledTimes(1);
      expect(setTimeout).not.toHaveBeenCalled();
    });

    it.todo('does not wait when the rate limiting request log is not empty and there is enough budget', async () => {
      // await interceptRequest(1);
      // vi.runAllTimers();
      // expect(mockedConfig).toHaveBeenCalledTimes(1);
      // expect(setTimeout).not.toHaveBeenCalled();
    });

    it.todo('clears the request log with stale requests upon receiving a new one', async () => {
      // await interceptRequest(1);
      // vi.runAllTimers();
      // expect(mockedConfig).toHaveBeenCalledTimes(1);
      // expect(setTimeout).not.toHaveBeenCalled();
    });

    it('crashes if the budget is smaller than a request cost', async () => {
      mockedConfig.mockReturnValue({
        reqLog: [],
        WINDOW_BUDGET: 1,
        WINDOW_LENGTH: 1,
      });

      await expect(() => interceptRequest(100)).rejects.toThrowError('request cannot proceed due to improper configuration');
    });

    it('waits the entire window length if two consecutives requests are above budget', () => {
      const reqLog: Log = [];
      mockedConfig.mockReturnValue({
        reqLog,
        WINDOW_BUDGET: 10,
        WINDOW_LENGTH: 30,
      });
      interceptRequest(5);
      interceptRequest(6);

      vi.runAllTimers();

      expect(mockedConfig).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledWith(expect.anything(), 30000);
    });

    it('waits when requests consume the whole budget (uniform 1sec)', () => {
      const reqLog: Log = [];
      mockedConfig.mockReturnValue({
        reqLog,
        WINDOW_BUDGET: 3,
        WINDOW_LENGTH: 5,
      });

      // t = 1
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      // t = 2
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      // t = 3, queue full
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      // t = 4, must wait till t = 6 to send
      interceptRequest(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.anything(), 2000);
      vi.advanceTimersByTime(1000);

      // t = 5, must wait till t = 7 to send
      interceptRequest(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.anything(), 2000);
      vi.advanceTimersByTime(1000);

      // t = 6, must wait till t = 8 to send
      interceptRequest(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.anything(), 2000);
      vi.advanceTimersByTime(1000);

      // t = 7, must wait till t = 11 to send because the oldest request is at t = 6, and it will clear at t = 11
      interceptRequest(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.anything(), 4000);
    });

    it('waits when requests consume the whole budget (4-burst, then wait and send on exact budget threshold)', () => {
      const reqLog: Log = [];
      mockedConfig.mockReturnValue({
        reqLog,
        WINDOW_BUDGET: 3,
        WINDOW_LENGTH: 30,
      });

      // t = 1
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      // t = 2
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      // t = 3, queue full
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      // t = 4, must wait till t = 31
      interceptRequest(1);
      expect(setTimeout).toHaveBeenCalledWith(expect.anything(), 27000);
      vi.advanceTimersByTime(28000);

      // t = 32, the t = 2 request is now in the past and we can send immediately
      interceptRequest(1);
      vi.advanceTimersByTime(1000);

      interceptRequest(1);
      vi.runAllTimers();
      expect(setTimeout).toHaveBeenCalledTimes(1);
    });
  });
});
