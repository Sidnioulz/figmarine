import os from 'node:os';
import path from 'node:path';

/**
 * Default path where disk caches will be saved and looked up.
 * Stored in the operating system's temporary files.
 */
export const DEFAULT_CACHE_PATH = path.join(os.tmpdir(), '@figmarine/cache');

/**
 *Number of seconds in a calendar year.
 */
export const YEAR_IN_SECONDS = 31556926;
