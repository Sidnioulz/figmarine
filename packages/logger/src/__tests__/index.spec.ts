import { log } from '../index';

describe('logger', () => {
  const errorSpy = vi.spyOn(global.console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.unstubAllEnvs();
    errorSpy.mockClear();
  });

  it('is silent by default', () => {
    vi.stubEnv('FIGMARINE_DEBUG', undefined);
    log('hello');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('prints to stderr when FIGMARINE_DEBUG is set', () => {
    vi.stubEnv('FIGMARINE_DEBUG', '1');
    log('hello');
    expect(console.error).toHaveBeenCalledWith('figmarine:', 'hello');
  });

  it('stays silent when FIGMARINE_DEBUG is falsy', () => {
    vi.stubEnv('FIGMARINE_DEBUG', '0');
    log('hello');
    vi.stubEnv('FIGMARINE_DEBUG', 'false');
    log('hello');
    vi.stubEnv('FIGMARINE_DEBUG', '');
    log('hello');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('forwards every argument', () => {
    vi.stubEnv('FIGMARINE_DEBUG', 'true');
    log('hello', { a: 1 }, 42);
    expect(console.error).toHaveBeenCalledWith('figmarine:', 'hello', { a: 1 }, 42);
  });
});
