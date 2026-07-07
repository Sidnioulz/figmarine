import { esmLibrary } from '@figmarine/config-tsup';
import type { Options } from 'tsup';

// The shebang in src/cli.ts is preserved by esbuild, making dist/cli.js
// executable as the `nursery` bin without polluting dist/index.js.
export default (options: Options) =>
  esmLibrary({ ...options, entryPoints: ['src/index.ts', 'src/cli.ts'] });
