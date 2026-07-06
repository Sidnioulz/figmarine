---
name: figma-cuttings
description: Snapshot Figma files into the repository and keep them fresh with the @figmarine/nursery CLI. Use when the user wants to capture Figma content locally (a "cutting"), refresh existing snapshots, check snapshot freshness, or turn Figma URLs into a .figmarine/nursery.json config.
---

# Managing Figma cuttings with the nursery CLI

A **cutting** is a committed JSON snapshot of Figma content (file document
tree, published components, component sets, styles), stored under
`.figmarine/cuttings/`. The `@figmarine/nursery` CLI creates and refreshes
cuttings from a config at `.figmarine/nursery.json`. Offline tools (linters,
design-token pipelines) read the cuttings instead of calling the Figma API.

## Prerequisites

- Authentication comes from the `FIGMA_PERSONAL_ACCESS_TOKEN` (or
  `FIGMA_OAUTH_TOKEN`) environment variable. Before running any command,
  check it is set (`test -n "$FIGMA_PERSONAL_ACCESS_TOKEN"`). If it is
  missing, ask the user to provide one — never echo the token's value.
- Run the CLI with `npx --yes @figmarine/nursery <command>` (or the
  project's pinned version if it is a dependency).

## Commands

| Task | Command |
| --- | --- |
| Add a Figma file to the config | `npx --yes @figmarine/nursery init "<figma url>" [--name <name>]` |
| Fetch and store configured cuttings | `npx --yes @figmarine/nursery take [name…]` |
| Refresh existing cuttings | `npx --yes @figmarine/nursery refresh [name…]` |
| Check snapshot freshness | `npx --yes @figmarine/nursery status [--max-age <seconds>]` |

All commands accept `--config <path>` when the config is not at the default
`.figmarine/nursery.json`.

## Typical requests and how to handle them

- **"Snapshot this Figma file"** (user gives a figma.com URL): run `init`
  with the URL, then `take` with the printed cutting name. Any
  `figma.com/design|file|board|proto/…` URL works; the CLI extracts the
  file key itself. Then show the user the planted file path and suggest
  committing `.figmarine/`.
- **"Refresh the design snapshots"**: run `refresh`. It re-fetches every
  cutting; unchanged Figma content leaves files byte-identical, so an empty
  `git diff` afterwards means nothing changed in Figma — report that
  plainly rather than as a failure.
- **"Are our snapshots up to date?"**: run `status --max-age <seconds>`
  (86400 for a day). Exit code 1 means at least one cutting is missing or
  stale — offer to run `refresh`.
- **"Snapshot only the styles/components"**: edit the file's `endpoints`
  array in `.figmarine/nursery.json` (valid values: `GetFile`,
  `GetFileComponents`, `GetFileComponentSets`, `GetFileStyles`), then
  `refresh` — the CLI detects the config change and re-takes the cutting.
- **"Pin the snapshot to the current Figma version"**: add a `version`
  string to the file entry in the config; refreshes then keep fetching
  that version.

## Troubleshooting

- `no config found`: run `init` first, or pass `--config`.
- Exit code 2: invalid usage (bad URL, malformed `--max-age`); the error
  message and usage text explain what to fix.
- 403/404 from the API: the token lacks access to the file, or the URL
  points at a deleted/private file.
- Long silent pauses during `take`/`refresh` on many-file configs are the
  built-in Figma rate limiter at work; per-cutting progress lines still
  print. Set `FIGMARINE_DEBUG=1` to see request-level diagnostics on
  stderr.
- Cuttings can be large (a full document tree can reach tens of MB). If
  the user is concerned about repository size, suggest scoping `endpoints`
  down for heavy files.
