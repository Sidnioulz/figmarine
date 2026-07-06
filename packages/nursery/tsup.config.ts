import { esmLibrary } from '@figmarine/config-tsup';
import type { Options } from 'tsup';

export default (options: Options) =>
  esmLibrary({
    ...options,
    entryPoints: ['src/index.ts', 'src/cli.ts'],
    // The shebang makes dist/cli.js executable as the `nursery` bin; node
    // ignores it in dist/index.js when imported.
    banner: { js: '#!/usr/bin/env node' },
  });
