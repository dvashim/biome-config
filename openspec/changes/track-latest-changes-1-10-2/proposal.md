# Proposal: track-latest-changes-1-10-2

> Interpretation note: "track latest changes, version 1.10.2" is read as the repo's
> recurring upstream-tracking pass, anchored at the just-released
> `@dvashim/biome-config` 1.10.2. Nothing else in the toolchain carries a 1.10.2
> version (Biome latest = 2.5.3, openspec latest = 1.6.0).

## Why

`@dvashim/biome-config` 1.10.2 shipped targeting Biome 2.5.3, and the repo's standing
obligation is to stay reconciled with the latest upstream releases. A verification pass
run on 2026-07-10 shows the presets are already on the latest stable Biome (npm `latest`
= 2.5.3), but the dev toolchain has drifted: the installed OpenSpec CLI is 1.5.0 while
1.6.0 is the latest release, and the working tree holds an uncommitted 1.4.1 → 1.5.0
regeneration of the `.claude/` command and skill assets. This change lands the tracking
pass so the audit result is recorded and the tooling drift is resolved rather than
lingering as uncommitted local state.

## What Changes

- Verify and record that the presets track the latest stable Biome (2.5.3): per the
  existing "Already on latest" scenario, no `$schema` or `@biomejs/biome` bump is made
  and the rule lists are confirmed reconciled against 2.5.3 (the only rule added in
  2.5.2/2.5.3, `noSvelteUnnecessaryStateWrap`, is Svelte-only and out of scope).
- Update the OpenSpec CLI from 1.5.0 to the latest release (1.6.0) and regenerate the
  `.claude/commands/opsx/*.md` and `.claude/skills/openspec-*/SKILL.md` assets so their
  `generatedBy` matches the installed CLI; commit the currently pending 1.5.0
  regeneration as part of this.
- Verify the remaining dev toolchain is current (confirmed at proposal time:
  `validate-package-exports` 1.2.1, `@changesets/cli` 2.31.0,
  `@changesets/changelog-github` 0.7.0, pnpm 11.11.0 are all npm `latest`).
- No changes to the published `dist/` presets are expected; if the audit surfaces none,
  no changeset is created (CLAUDE.md scopes changesets to user-facing changes).

## Capabilities

### New Capabilities

- `dev-tooling-currency`: the repo's dev toolchain (devDependencies, pnpm,
  OpenSpec CLI) tracks the latest stable releases, and OpenSpec-generated `.claude/`
  assets are regenerated — never hand-edited — whenever the CLI version changes.

### Modified Capabilities

<!-- none — `linter-rule-coverage` already requires that presets track the latest
     stable Biome release, including the "Already on latest" scenario this change
     executes; no requirement is being added or altered. -->

## Impact

- **Dev tooling only**: global OpenSpec CLI install; `.claude/commands/opsx/*.md` and
  `.claude/skills/openspec-*/SKILL.md` (regenerated files).
- **Published package**: none expected — `dist/` presets, `package.json`, and README
  stay untouched, so no release is triggered.
- **Specs**: new `dev-tooling-currency` capability spec; `linter-rule-coverage`
  unchanged.
