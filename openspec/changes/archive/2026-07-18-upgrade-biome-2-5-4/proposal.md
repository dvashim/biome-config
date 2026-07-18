# Proposal: upgrade-biome-2-5-4

> Scope note: "update to the latest Biome, add new relevant rules, update
> documentation" is read against today's upstream state — npm `latest` for
> `@biomejs/biome` is **2.5.4** (published 2026-07-15), while the presets still
> pin **2.5.3**. This is the `linter-rule-coverage` "Newer release available"
> scenario. The 2.5.4 rule audit is part of the work, and its result ("no new
> in-scope rules") is recorded below rather than assumed.

## Why

The presets carry a standing obligation to target the latest stable Biome
release (`linter-rule-coverage`: "Presets track the latest stable Biome
release"). Biome shipped **2.5.4** on 2026-07-15; the presets still document and
pin **2.5.3**, so the published `$schema` URLs and the README are one patch
behind. Dependabot has already landed the `@biomejs/biome` `^2.5.3` → `^2.5.4`
devDependency bump in the working tree (uncommitted), leaving the repo in a
half-upgraded state that this change resolves.

## What Changes

- **Bump the target Biome version 2.5.3 → 2.5.4** by updating the `$schema` URL
  in all six `dist/*.json` presets and in the root `biome.json` (seven files),
  and by committing the pending `@biomejs/biome` `^2.5.4` devDependency bump
  already in the working tree.
- **Rule audit against 2.5.4 — no rule changes.** 2.5.4 is a bug-fix /
  formatter-polish patch: it adds **no new lint rules** and **renames, graduates
  (out of nursery), or removes none**. Its rule-adjacent items only fix existing,
  already-covered rules (`noLabelWithoutControl`, `noCommentText`) and enhance an
  already-enabled nursery rule (`useSortedClasses`). Therefore `react-strict`,
  `react-balanced`, and both `-stable` variants are **unchanged**, and
  `pnpm sync-stable` produces no diff. The "add new relevant rules" ask resolves
  to zero additions for this release, and the result is recorded here.
- **Update documentation** — refresh every 2.5.3 reference in `README.md`: the
  Requirements line, the Defaults → Schema URL, and the FAQ (version-support
  paragraph, `pnpm add -D @biomejs/biome@^2.5.4` command, and the pin-your-schema
  note).
- **Add a changeset** (patch) describing the 2.5.4 target bump. Unlike the
  previous tracking pass, this one **is** user-facing — the published `$schema`
  URLs and README change — matching the PR #163 precedent that released the
  2.5.1 → 2.5.3 `$schema` bump.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one added requirement** — *Version-tracking
  passes release according to their published impact* — that records the release
  consequence the last two tracking passes each derived by hand:
  `track-latest-changes-1-10-2` created no changeset (nothing published changed),
  while this pass ships a `patch` changeset (the `dist/*.json` `$schema` strings and
  `README.md` change). The existing bump-mechanics and rule-reconciliation
  requirements are left untouched (delta is ADDED, not MODIFIED).

## Impact

- **Published package** (triggers a patch release): `dist/*.json` (`$schema`
  string only — no rule changes), `README.md`, and `package.json`
  (`@biomejs/biome` devDependency range). Consumers who pin the preset `$schema`
  move to the 2.5.4 schema; no lint behavior changes beyond what Biome 2.5.4
  itself ships.
- **Root config**: `biome.json` `$schema` (repo dogfoods the preset).
- **Dev tooling (ride-along, governed by `dev-tooling-currency`)**: the same
  Dependabot pass already bumped `@changesets/cli` 2.31.0 → 2.31.1 and
  `validate-package-exports` 1.2.1 → 1.2.2 in the working tree; these land in the
  same commit as dev-only currency updates.
- **Specs**: `linter-rule-coverage` gains one added requirement (the
  release-consequence of a tracking pass); `dev-tooling-currency` unchanged. No
  existing requirement text is altered.
- **Not touched**: preset rule lists, formatter/VCS/files/overrides settings,
  Node `engines`, package `version` (Changesets owns the version bump on release).
