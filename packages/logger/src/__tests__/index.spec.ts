import { log } from '../index';

vi.spyOn(global.console, 'log');

describe('logger', () => {
  it('prints a message', () => {
    log('hello');
    expect(console.log).toHaveBeenCalledWith('LOGGER: ', 'hello');
  });
});
