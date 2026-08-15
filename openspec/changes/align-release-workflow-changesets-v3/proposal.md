## Why

The `@changesets/cli` v2 → v3 bump (commit `d26b0c8`) updated the dependency but left every integration point around it untouched. The most serious consequence is that `.github/workflows/release.yml` still pins `changesets/action@v1.9.0`, which detects published packages by regex-matching `New tag:` in `changeset publish` stdout — a string CLI v3 no longer emits. On the next release npm publish would still succeed, but the action would report `published: "false"`, skip the `v<version>` git tag, and create no GitHub release. It fails silently: v1.9.0 has no CLI version assertion. Upstream split the majors deliberately (action v2.0.0 "Update to Changesets v3 packages"; PR #699 directs CLI v2 users back to `@v1`).

## What Changes

- **BREAKING (release automation)** — Upgrade `changesets/action` from v1.9.0 to v2.1.0 in `.github/workflows/release.yml`, pinned by commit SHA, and migrate its renamed inputs: `version` → `version-script`, `publish` → `publish-script`, `setupGitUser` dropped (v2 configures `github-actions[bot]` as the fallback identity automatically), and the `GITHUB_TOKEN` env var dropped (v2 reads the `github-token` input, which already defaults to the GitHub-provided token). Accept v2's new default of pushing release commits and tags through the GitHub API rather than the Git CLI.
- Bump the `$schema` URL in `.changeset/config.json` from `@changesets/config@3.1.2` to the installed `@changesets/config@4.0.0`. The config's contents remain valid under v4 — no key migration is needed.
- Remove the now-impossible `node-fetch@2` / `ERR_STREAM_PREMATURE_CLOSE` troubleshooting note from `CLAUDE.md`; `node-fetch` is absent from `pnpm-lock.yaml` entirely now that `@changesets/get-github-info@1.0.0` depends only on `dataloader`.
- Record the general obligation in the spec: a major upgrade of a dev tool must reconcile that tool's integration points, not just its version range.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dev-tooling-currency`: adds a requirement that a **major** dev-tool upgrade reconcile the tool's integration points — CI actions bound to that major, pinned schema URLs, and documentation describing behavior the upgrade removed — in the same change as the version bump.

## Impact

- `.github/workflows/release.yml` — action version, pinned SHA, input names, `env` block.
- `.changeset/config.json` — `$schema` URL only.
- `CLAUDE.md` — removal of a stale troubleshooting paragraph.
- `openspec/specs/dev-tooling-currency/spec.md` — one added requirement.
- No consumer-visible impact: nothing under `dist/` or in `README.md` changes, so per the repo's changeset-sizing rule this ships with **no changeset**.
- Not affected, and verified as such:
  - **npm authentication** — trusted publishing via `id-token: write` + `NPM_CONFIG_PROVENANCE`; no `NPM_TOKEN` is used, so v2's removal of `.npmrc` token handling is inert.
  - **Node and pnpm floors** — CLI v3 requires node `^22.11 || ^24 || >=26` and pnpm `>=10.0.0`; `.node-version` is `24` and `packageManager` is pnpm 11.20.0.
  - **`changeset version` now exits 1 when there are no unreleased changesets** — the action invokes the version script only after detecting changesets, so the new exit code is unreachable from this workflow.
  - **`changeset tag` renamed to `changeset git-tag`** — neither workflow invokes that command; tags come from the action's publish path.
  - **`.github/workflows/check.yml`** — runs only `pnpm ci` and `pnpm run check`, invoking no Changesets tooling.
