import os from 'node:os';
import path from 'node:path';

export const cachePath = path.join(os.tmpdir(), '@figmarine/cache');
