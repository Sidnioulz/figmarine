/**
 * Whether diagnostic logging is enabled. Off by default so that CLIs and
 * libraries stay quiet; set the FIGMARINE_DEBUG environment variable to
 * anything but '0' or 'false' to enable it.
 */
function isEnabled(): boolean {
  const flag = process.env.FIGMARINE_DEBUG;

  return flag !== undefined && flag !== '' && flag !== '0' && flag !== 'false';
}

/**
 * Logs diagnostic information to stderr when FIGMARINE_DEBUG is set.
 * Writing to stderr keeps the stdout of Figmarine CLIs machine-readable.
 * @param args Values to log.
 */
export const log = (...args: unknown[]): void => {
  if (isEnabled()) {
    console.error('figmarine:', ...args);
  }
};
