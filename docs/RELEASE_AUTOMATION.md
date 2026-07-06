# Release automation

This document describes how Figmarine packages get released automatically when
the Figma OpenAPI spec changes, and what a repository administrator must
configure for the chain to work end to end.

## The auto-deploy chain

```
Figma publishes @figma/rest-api-spec vX.Y.Z
  │  (npm)
  ▼
Dependabot daily run (after a 2-day cooldown, see below)
  │  opens a PR titled "chore(deps): bump the oas group …"
  ▼
Dependabot automerge workflow (.github/workflows/automerge-dependabot.yml)
  │  1. pnpm api:regen  → regenerates packages/rest/src/__generated__
  │     from the *installed* @figma/rest-api-spec package
  │  2. commits "feat(rest): Update OpenAPI Spec generated code"
  │     (only if the generated code actually changed)
  │  3. dispatches the CI workflow on the updated branch
  │  4. approves the PR and enables auto-merge (rebase)
  ▼
CI passes → PR auto-merges to main
  ▼
Semantic Release workflow (.github/workflows/semantic-release.yml)
  │  runs after CI succeeds on main, and once a day as a fallback
  ▼
multi-semantic-release analyzes commits since the last release
  │  feat(rest) → minor bump of @figmarine/rest
  ▼
@figmarine/rest published to npm with fresh Figma API types
```

The `feat(rest)` commit created by the regen step is what triggers the
release: Dependabot's own `chore(deps)`/`chore(deps-dev)` commits are ignored
by the commit analyzer, so a spec bump that does not change generated code
publishes nothing (by design).

## Administrator checklist

The workflows only use `GITHUB_TOKEN`; no PAT is required (see the release
latency note below for the trade-off). The following repository settings must
be enabled:

1. **Allow auto-merge** — *Settings → General → Pull Requests → Allow
   auto-merge*. Required for `gh pr merge --auto`.
2. **Allow GitHub Actions to create and approve pull requests** — *Settings →
   Actions → General → Workflow permissions*. Required for
   `gh pr review --approve` in the automerge workflow.
3. **Branch protection on `main`** with required status checks `lint`,
   `test`, `build` and `api-drift` (the CI job names, which match the
   check-run names since no job uses a matrix). Auto-merge waits for these;
   without required checks, Dependabot PRs merge before CI finishes.
4. **Secrets**:
   - `NPM_TOKEN`: npm automation token with publish rights on the
     `@figmarine` scope. Semantic Release fails on `main` when it expires —
     check the *Semantic Release* workflow runs if packages stop publishing.
   - `CODECOV_TOKEN`: used by CI to upload coverage.

## Design notes and failure modes

- **Regeneration is deterministic.** `pnpm api:regen` reads
  `openapi/openapi.yaml` from the installed `@figma/rest-api-spec` package,
  so generated code always matches the pinned version. Set `FIGMA_BRANCH` to
  a branch or tag of `figma/rest-api-spec` to try an unreleased spec locally.
- **The `api-drift` CI job** regenerates the client on every PR and fails if
  the committed generated code differs (including new or renamed files). This
  catches spec, generator or formatter bumps that skipped regeneration.
- **`GITHUB_TOKEN` pushes do not trigger `pull_request` workflows.** The
  regen commit would otherwise sit without CI checks and auto-merge would
  wait forever. The automerge workflow works around this by dispatching the
  CI workflow (`workflow_dispatch` is exempt from the restriction); check
  runs attach to the head commit, satisfying branch protection. If the PR
  branch predates the `workflow_dispatch` trigger in the CI workflow, the
  dispatch fails; the workflow then comments `@dependabot rebase` so the
  branch is recreated from current `main` and the flow self-heals.
- **Release latency after auto-merge.** The same `GITHUB_TOKEN` rule means a
  Dependabot auto-merge does not trigger the CI `push` run on `main`, so the
  `workflow_run`-gated Semantic Release would never fire for those merges.
  The Semantic Release workflow therefore also runs on a daily schedule (and
  supports manual `workflow_dispatch` for an immediate release). Releases
  triggered by human pushes to `main` still happen immediately. If you want
  auto-merged releases to publish immediately too, enable auto-merge with a
  fine-grained PAT or GitHub App token instead of `GITHUB_TOKEN`.
- **The `oas` Dependabot group contains `@figma/rest-api-spec`,
  `swagger-typescript-api` and `prettier`**, because bumps of any of them can
  change generated output (the spec, the generator, and the formatter applied
  to generated code). All three therefore go through the regen flow.
- **GitHub Action bumps are not auto-merged.** Dependabot PRs titled `ci: …`
  (the github-actions ecosystem) update code that runs with repository
  secrets, so the automerge workflow deliberately skips approving and merging
  them — a human must review.
- **Breaking spec changes ship as minor releases.** The regen commit is
  always `feat(rest)`, so a Figma spec that removes or renames endpoints
  still publishes as semver-minor. Watch the
  [Figma API changelog](https://www.figma.com/developers/api#changelog) for
  removals; if one lands, publish a manual release with a
  `feat(rest)!:`/`BREAKING CHANGE:` commit instead of letting the automation
  ship it quietly.
- **Supply-chain age gate.** pnpm 11 rejects dependency versions younger
  than 24h (`minimumReleaseAge` in `pnpm-workspace.yaml`). Dependabot is
  configured with a 2-day `cooldown` so its PRs propose versions that clear
  the gate. If you ever need a fresher version, add it to
  `minimumReleaseAgeExclude`.
- **Packages that release**: `multi-release.config.js` ignores `config-*`,
  `cuttings`, `nursery` and `eslint-plugin-figma` for now. Remove entries
  from `ignorePackages` to start releasing them.
- **GitLab mirror.** The README badge points to a GitLab CI mirror whose
  pipeline definition lives outside this repository. After the pnpm 11 /
  Node ≥ 22.22 upgrade, that pipeline must install pnpm 11 (e.g. via
  corepack) and a recent Node 22 image, or its builds will diverge from
  GitHub CI.

## Manual operations

- `pnpm api:regen` (repo root or `packages/rest`): regenerate the REST client
  from the installed spec, formatted and ready to commit.
- `FIGMA_BRANCH=<branch-or-tag> pnpm api:regen`: regenerate from an
  unreleased upstream spec.
- `pnpm release:dry`: dry-run the release pipeline locally (requires being on
  a branch with a configured remote; no publishing happens).
- *Actions → Semantic Release → Run workflow*: trigger an immediate release
  from `main`, e.g. right after a Dependabot auto-merge.
