
<div align="center">
  <h1>@figmarine/cuttings</h1>
  
  <p>
    A Node.js library to download Figma files and their metadata, and to store them as JSON files.
  </p>
  
  
  <p>
    <img src="https://img.shields.io/badge/status-beta-yellow" alt="Status: beta" />
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/commit-activity/m/Sidnioulz/figmarine" alt="commit activity" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/last-commit/Sidnioulz/figmarine" alt="last commit" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/issues?q=is%3Aopen+is%3Aissue+label%3Apkg-cuttings"><img src="https://img.shields.io/github/issues-search?query=repo%3ASidnioulz%2Ffigmarine%20is%3Aopen%20is%3Aissue%20label%3Apkg-cuttings&label=issues" alt="open issues" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/Sidnioulz/figmarine/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main" alt="CodeQL status" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/actions/workflows/continuous-integration.yml"><img src="https://github.com/Sidnioulz/figmarine/actions/workflows/continuous-integration.yml/badge.svg?branch=main" alt="CI status" /></a>
    <a href="https://codecov.io/gh/Sidnioulz/figmarine"><img src="https://codecov.io/gh/Sidnioulz/figmarine/graph/badge.svg?token=4SX3N57XH3" alt="code coverage" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/graphs/contributors"><img src="https://img.shields.io/github/contributors/Sidnioulz/figmarine" alt="contributors" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/blob/main/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg" alt="code of conduct: contributor covenant 2.1" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Sidnioulz/figmarine.svg" alt="license" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/network/members"><img src="https://img.shields.io/github/forks/Sidnioulz/figmarine" alt="forks" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/stargazers"><img src="https://img.shields.io/github/stars/Sidnioulz/figmarine" alt="stars" /></a>
    <a href="https://github.com/sponsors/Sidnioulz"><img src="https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA" alt="sponsor this project" /></a>
  </p>
   
  <h4>
    <a href="https://github.com/Sidnioulz/figmarine/packages/cuttings">📗 Documentation</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=bug,pkg-cuttings">🐛 Report a Bug</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=enhancement,pkg-cuttings">💡 Request Feature</a>
  </h4>
</div>

<br />

## :notebook_with_decorative_cover: Table of Contents

<!-- no toc -->
  - [Package Details](#star2-package-details)
  - [Roadmap](#dart-roadmap)
  - [Contributing](#wave-contributing)
  - [License](#warning-license)
  - [Support](#sos-support)

## :star2: Package Details

A cutting is a JSON snapshot of Figma content, fetched over the REST API and
stored on disk. Like the botanical kind, you take a cutting once and keep it
alive by re-hydrating it whenever you need fresh data. Cuttings power offline
analysis of Figma files, such as linting them with `eslint-plugin-figma`,
without paying an API round-trip on every run.

### Usage

```ts
import { Client } from '@figmarine/rest';
import { digCutting, hydrate, parseFigmaUrl, plantCutting, take } from '@figmarine/cuttings';

const client = await Client({ personalAccessToken: process.env.FIGMA_PERSONAL_ACCESS_TOKEN });

// Turn a Figma URL into a file key.
const { fileKey } = parseFigmaUrl('https://www.figma.com/design/abc123/My-File');

// Take a cutting: fetch the data described by each facet.
const cutting = await take({
  client,
  label: 'My design system',
  facets: [
    { endpoint: 'GetFile', id: fileKey },
    { endpoint: 'GetFileComponents', id: fileKey },
    { endpoint: 'GetFileComponentSets', id: fileKey },
    { endpoint: 'GetFileStyles', id: fileKey },
  ],
});

// Plant it: store it on disk, pretty-printed for reviewable diffs.
plantCutting(cutting, '.figmarine/cuttings/design-system.cutting.figmarine.json');

// Later: dig it up and re-hydrate it with fresh data.
const stored = digCutting('.figmarine/cuttings/design-system.cutting.figmarine.json');
const fresh = await hydrate({ client, cutting: stored });
plantCutting(fresh, stored.meta.lastKnownFilePath!);
```

### Serving API calls from cuttings

Attach cuttings to a `@figmarine/rest` client and compatible API calls are
answered from planted data instead of the network — the calling code does
not change at all:

```ts
import { Client } from '@figmarine/rest';
import { attachCuttings, digCutting } from '@figmarine/cuttings';

const client = await Client({ personalAccessToken: process.env.FIGMA_PERSONAL_ACCESS_TOKEN });
const cutting = digCutting('.figmarine/cuttings/design-system.cutting.figmarine.json');

const detach = attachCuttings(client, [cutting]);

// Served from the cutting: no network, no rate limit budget.
const file = await client.v1.getFile(fileKey);

// Not snapshotted by cuttings: falls through to the network.
const versions = await client.v1.getFileVersions(fileKey);

detach();
```

A call is served when it is a `GET` request to a snapshotted endpoint
(`GetFile`, `GetFileComponents`, `GetFileComponentSets`, `GetFileStyles`),
for a file key an attached cutting holds, with query parameters the stored
data can honour. `GetFile` calls with `ids`, `depth`, `geometry` or
`plugin_data` always fall through, and `version` must match the facet's pin
or the stored file's version. Everything else behaves as usual, so a client
with cuttings attached keeps working for uncovered endpoints.

Served responses differ from the wire format in one documented way: file
bodies are the stored `SlimFile` (no `thumbnailUrl`, `role` or
`linkAccess`). They carry an `x-figmarine-cutting` response header (exported
as `CUTTING_SOURCE_HEADER`) so tooling can tell data sources apart. Cuttings
are authoritative regardless of age — freshness is a separate concern,
handled with `hydrate` or `@figmarine/nursery` refresh schedules.

If you configure your cuttings with `@figmarine/nursery`, prefer its
`connectNursery(client)` helper, which digs every planted cutting for you.

### The cutting file format

A cutting file is a JSON document with three top-level keys:

- `meta`: a `label`, the `lastStored` timestamp, the `figmarineVersion` of
  the format (currently `0`), and the `lastKnownFilePath` it was loaded from.
- `facets`: the API calls needed to (re-)hydrate the cutting. Each facet has
  an `endpoint` (e.g. `GetFile`), the `id` to pass to that endpoint (file
  key, published component key, team id…), an optional `version` for
  versioned endpoints, and the `lastHydrated` timestamp maintained by the
  library.
- `data`: dictionaries of fetched content, keyed by id — `files` (slimmed
  `GetFile` bodies, keyed by file key), `components`, `componentSets` and
  `styles` (published metadata keyed by their published `key`), plus
  reserved dictionaries for variables, projects and future facet types.

File data is slimmed before storage: volatile fields such as `thumbnailUrl`,
`role` or `linkAccess` are dropped so that repeated hydrations of unchanged
files produce empty diffs.

### Supported facet endpoints

`GetFile`, `GetFileComponents`, `GetFileComponentSets` and `GetFileStyles`
are implemented. Other endpoint types declared in the schema (teams,
projects, variables) are reserved and `take` throws a clear error for them.
Variables endpoints require a Figma Enterprise plan and will come later.

### Test fixtures

The test suite runs against real recorded API responses stored in
`src/__fixtures__/api/`. Regenerate them with
`pnpm fixtures:regen` (requires `FIGMA_PERSONAL_ACCESS_TOKEN` and read access
to the fixture files).

## :dart: Roadmap

- [x] Finalise cutting format (core file, facets)
- [ ] Optimise data overlap between some facets
- [x] Write FS middleware to store and retrieve cuttings
- [x] Use REST API client to download cuttings
- [x] Create hydration helpers
- [x] Use zod for schema validation on FS-loaded files
- [x] Improve zod parse error printing
- [x] Add ability to name/describe cutting files and use the name in logs
- [x] Export Node.js library
- [x] Add unit tests
- [x] Document the library
- [x] Document the cutting file format
- [ ] Support team, project and variable facets
- [ ] Facet options (depth, geometry, plugin_data)
- [x] Serve compatible REST client calls from cuttings
- [x] Automate NPM releases


## :wave: Contributing

See [how to contribute](https://github.com/Sidnioulz/figmarine/tree/main?tab=readme-ov-file#package-contributing).

## :warning: License

Distributed under the [MIT License](https://github.com/Sidnioulz/figmarine/tree/main?tab=MIT-1-ov-file).

## :sos: Support

Please open a conversation in the [discussion space](https://github.com/Sidnioulz/figmarine/discussions) to ask a question.

Please [open an issue](https://github.com/Sidnioulz/figmarine/issues/new?labels=pkg-cuttings) for bug reports or code suggestions.

