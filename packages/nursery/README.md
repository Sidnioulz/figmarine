<div align="center">
  <h1>@figmarine/nursery</h1>

  <p>
    A CLI that grows and refreshes Figmarine cuttings from Figma URLs.
  </p>

  <p>
    <img src="https://img.shields.io/badge/status-beta-yellow" alt="Status: beta" />
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/commit-activity/m/Sidnioulz/figmarine" alt="commit activity" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/last-commit/Sidnioulz/figmarine" alt="last commit" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/issues?q=is%3Aopen+is%3Aissue+label%3Apkg-nursery"><img src="https://img.shields.io/github/issues-search?query=repo%3ASidnioulz%2Ffigmarine%20is%3Aopen%20is%3Aissue%20label%3Apkg-nursery&label=issues" alt="open issues" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/actions/workflows/continuous-integration.yml"><img src="https://github.com/Sidnioulz/figmarine/actions/workflows/continuous-integration.yml/badge.svg?branch=main" alt="CI status" /></a>
    <a href="https://codecov.io/gh/Sidnioulz/figmarine"><img src="https://codecov.io/gh/Sidnioulz/figmarine/graph/badge.svg?token=4SX3N57XH3" alt="code coverage" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/blob/main/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg" alt="code of conduct: contributor covenant 2.1" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Sidnioulz/figmarine.svg" alt="license" /></a>
    <a href="https://github.com/sponsors/Sidnioulz"><img src="https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA" alt="sponsor this project" /></a>
  </p>

  <h4>
    <a href="https://github.com/Sidnioulz/figmarine/packages/nursery">📗 Documentation</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=bug,pkg-nursery">🐛 Report a Bug</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=enhancement,pkg-nursery">💡 Request Feature</a>
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

The nursery turns Figma URLs into [cuttings](../cuttings/) — JSON snapshots
of Figma content committed to your repository — and keeps them fresh. Point
it at the files you care about once; from then on, one command refreshes
every snapshot.

### Getting started

```sh
# Add a cutting entry for a Figma file (creates .figmarine/nursery.json).
export FIGMA_PERSONAL_ACCESS_TOKEN=figd_…
pnpm dlx @figmarine/nursery init "https://www.figma.com/design/abc123/My-Design-System"

# Fetch the data and plant the cutting in .figmarine/cuttings/.
pnpm dlx @figmarine/nursery take

# Later — in CI, on a schedule, or before linting — refresh everything.
pnpm dlx @figmarine/nursery refresh

# Check freshness; exits 1 when a cutting is missing or older than a day.
pnpm dlx @figmarine/nursery status --max-age 86400
```

### Commands

| Command                | Effect                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| `init <figma url…>`    | Add a cutting entry for the given file URLs (`--name` to name it).        |
| `take [name…]`         | Fetch and plant the configured cuttings (all of them when no name given). |
| `refresh [name…]`      | Re-hydrate planted cuttings; takes them when missing or config changed.   |
| `status [name…]`       | Report freshness; `--max-age <seconds>` makes staleness fail the command. |

All commands accept `--config <path>` (default: `.figmarine/nursery.json`).
Authentication uses the `FIGMA_PERSONAL_ACCESS_TOKEN` or `FIGMA_OAUTH_TOKEN`
environment variable; tokens never live in config files.

### The config file

```json
{
  "output": "cuttings",
  "cuttings": {
    "design-system": {
      "label": "Design system",
      "files": [
        {
          "url": "https://www.figma.com/design/abc123/My-Design-System",
          "endpoints": ["GetFile", "GetFileComponents", "GetFileComponentSets", "GetFileStyles"]
        }
      ]
    }
  }
}
```

- Each named cutting snapshots one or more Figma files.
- `endpoints` selects what to fetch per file, and defaults to the whole
  file-scoped set.
- A `version` on a file entry pins its `GetFile` facet to a specific Figma
  file version; refreshes then keep re-fetching that version.
- `output` is where cuttings are planted. Relative paths resolve against
  the directory containing the config file, so the default plants cuttings
  in `.figmarine/cuttings/` next to `.figmarine/nursery.json`.
- A [JSON schema](./schema/nursery.schema.json) is published with the package
  for editor validation; regenerate it with `pnpm schema:regen` after
  changing the config format.

Cuttings and config are designed to be committed: refreshes produce
reviewable diffs, and analysis tools such as `eslint-plugin-figma` read the
planted cuttings without touching the network.

### Refreshing on a schedule

The package ships workflow templates that refresh every cutting on weekday
mornings and open a pull request when Figma content changed:

- [GitHub Actions](./templates/github-actions-refresh.yml): copy it to
  `.github/workflows/refresh-cuttings.yml` and add a
  `FIGMA_PERSONAL_ACCESS_TOKEN` secret to your repository.
- [CircleCI](./templates/circleci-refresh.yml): merge it into
  `.circleci/config.yml` and create a `figmarine` context with
  `FIGMA_PERSONAL_ACCESS_TOKEN` and `GITHUB_TOKEN`.

Each template documents its own caveats in its header comments.

### Driving the CLI from Claude Code

The package ships a [Claude Code skill](./templates/claude-skill/figma-cuttings/SKILL.md)
that teaches agent sessions to snapshot and refresh Figma files
conversationally. Copy the `figma-cuttings` directory into your repository's
`.claude/skills/` to enable it.

## :dart: Roadmap

- [x] `init`, `take`, `refresh` and `status` commands
- [x] Committed, reviewable `.figmarine/` state
- [x] Publish a JSON schema for the config file
- [x] GitHub Actions workflow template for scheduled refreshes
- [x] CircleCI workflow template
- [x] Claude Code skill wrapping the CLI
- [x] Automate NPM releases

## :wave: Contributing

See [how to contribute](https://github.com/Sidnioulz/figmarine/tree/main?tab=readme-ov-file#package-contributing).

## :warning: License

Distributed under the [MIT License](https://github.com/Sidnioulz/figmarine/tree/main?tab=MIT-1-ov-file).

## :sos: Support

Please open a conversation in the [discussion space](https://github.com/Sidnioulz/figmarine/discussions) to ask a question.

Please [open an issue](https://github.com/Sidnioulz/figmarine/issues/new?labels=pkg-nursery) for bug reports or code suggestions.
