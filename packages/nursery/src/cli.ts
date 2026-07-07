#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { realpathSync } from 'node:fs';

import { init } from './commands/init';
import { refresh } from './commands/refresh';
import { status } from './commands/status';
import { takeCommand } from './commands/take';

const USAGE = `Usage: nursery <command> [options]

Commands:
  init <figma url…>    Add a cutting entry for the given Figma file URLs.
  take [name…]         Take and plant the configured cuttings.
  refresh [name…]      Re-hydrate planted cuttings (or take missing ones).
  status [name…]       Report the freshness of planted cuttings.

Options:
  -c, --config <path>  Path to the nursery config file.
                       Defaults to .figmarine/nursery.json.
  -n, --name <name>    (init) Name of the new cutting entry.
  --max-age <seconds>  (status) Exit with code 1 when a cutting is missing
                       or older than this.
  -h, --help           Show this help message.

Authentication uses the FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_OAUTH_TOKEN
environment variable. Set FIGMARINE_DEBUG=1 for diagnostic output.`;

function formatAge(timestamp: number | undefined, now: number): string {
  if (!timestamp) {
    return 'never';
  }
  const minutes = Math.round((now - timestamp) / 60000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  return `${Math.round(hours / 24)}d ago`;
}

function parseCliArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      config: { type: 'string', short: 'c' },
      name: { type: 'string', short: 'n' },
      'max-age': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
}

/**
 * Runs the nursery CLI.
 * @param argv Process arguments, without the node binary and script name.
 * @returns The process exit code.
 */
export async function run(argv: string[]): Promise<number> {
  let parsed: ReturnType<typeof parseCliArgs>;
  try {
    parsed = parseCliArgs(argv);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    console.error(USAGE);
    return 2;
  }

  const { values, positionals } = parsed;
  const [command, ...args] = positionals;

  if (values.help || !command) {
    console.log(USAGE);
    return values.help ? 0 : 2;
  }

  const configPath = values.config as string | undefined;

  try {
    switch (command) {
      case 'init': {
        const name = init({ urls: args, name: values.name as string | undefined, configPath });
        console.log(`Added cutting '${name}'. Run 'nursery take ${name}' to plant it.`);
        return 0;
      }

      case 'take': {
        const planted = await takeCommand({ names: args, configPath, onProgress: console.log });
        console.log(planted.map((p) => `Planted ${p}`).join('\n'));
        return 0;
      }

      case 'refresh': {
        const planted = await refresh({ names: args, configPath, onProgress: console.log });
        console.log(planted.map((p) => `Refreshed ${p}`).join('\n'));
        return 0;
      }

      case 'status': {
        const rawMaxAge = values['max-age'] as string | undefined;
        let maxAgeSeconds: number | undefined;
        if (rawMaxAge !== undefined) {
          maxAgeSeconds = Number(rawMaxAge);
          if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) {
            console.error(`Invalid --max-age value '${rawMaxAge}': pass a number of seconds.`);
            console.error(USAGE);
            return 2;
          }
        }

        const reports = status({ names: args, configPath, maxAgeSeconds });

        const now = Date.now();
        for (const report of reports) {
          const state = !report.planted
            ? 'missing'
            : `${report.facetCount} facets, hydrated ${formatAge(report.oldestHydration, now)}`;
          console.log(`${report.stale ? '✗' : '✓'} ${report.name}: ${state} (${report.location})`);
        }

        return reports.some((r) => r.stale) ? 1 : 0;
      }

      default:
        console.error(`Unknown command '${command}'.`);
        console.error(USAGE);
        return 2;
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

/* v8 ignore start -- entry point, exercised via the bin, not via tests */
/**
 * Runs when this module is the process entrypoint. Node resolves the real
 * path of the main ES module while argv keeps the path the user invoked
 * (often a node_modules/.bin symlink), so both sides must be realpathed.
 */
function isDirectRun(): boolean {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  process.exitCode = await run(process.argv.slice(2));
}
/* v8 ignore stop */
