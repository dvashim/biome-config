# Design: track-latest-changes-1-10-2

## Context

`@dvashim/biome-config` 1.10.2 is released and targets Biome 2.5.3, which is still the
npm `latest` dist-tag (verified 2026-07-10). The published side of the repo is therefore
current, and the `linter-rule-coverage` spec's "Already on latest" scenario applies: no
`$schema` or dependency bump, rule lists confirmed against 2.5.3.

The dev toolchain is the part that drifted:

- The globally installed OpenSpec CLI (`@fission-ai/openspec`, via pnpm global bin) is
  1.5.0; the latest release is 1.6.0.
- The working tree holds an uncommitted regeneration of `.claude/commands/opsx/*.md`
  and `.claude/skills/openspec-*/SKILL.md` from the previous CLI update
  (`generatedBy: 1.4.1` → `1.5.0`, adding "Store selection" guidance and dropping
  workspace-planning guards).
- All other dev tools are at latest: `validate-package-exports` 1.2.1,
  `@changesets/cli` 2.31.0, `@changesets/changelog-github` 0.7.0, pnpm 11.11.0.

## Goals / Non-Goals

**Goals:**

- Record the Biome tracking result: presets already reconciled against 2.5.3, no
  dist changes needed.
- Bring the OpenSpec CLI to the latest release (1.6.0) and land regenerated `.claude/`
  assets whose `generatedBy` matches the installed CLI.
- Establish `dev-tooling-currency` as a spec'd capability so future tracking passes
  have explicit requirements to execute.

**Non-Goals:**

- No changes to the six `dist/` presets, `package.json`, `biome.json`, or README.
- No npm release; no changeset (nothing user-facing changes).
- No modification of the `linter-rule-coverage` spec — the Biome side of this pass
  executes its existing requirements.
- No Node/engines changes.

## Decisions

1. **No Biome bump.** npm `latest` for `@biomejs/biome` is 2.5.3, which the presets
   already target. Per the existing spec's "Already on latest" scenario, only the rule
   reconciliation is confirmed (the sole 2.5.2/2.5.3 rule addition,
   `noSvelteUnnecessaryStateWrap`, is Svelte-only and excluded by the out-of-scope
   requirement). Alternative — bumping to a nightly/beta — rejected: presets track
   stable releases only.

2. **Update the OpenSpec CLI globally via pnpm, then regenerate.** Run
   `pnpm add -g @fission-ai/openspec@latest`, then the CLI's own update/regeneration
   command (`openspec update`; confirm the exact subcommand against `openspec --help`
   in 1.6.0) so the `.claude/` assets are tool-generated, never hand-edited.

3. **One commit for both regeneration steps.** The pending 1.4.1→1.5.0 diff was never
   committed, so it lands together with the 1.5.0→1.6.0 regen as a single
   tool-generated state. Alternative — two commits preserving each version's diff —
   rejected: the intermediate state has no standalone value and was never a working
   baseline.

4. **No changeset.** CLAUDE.md scopes changesets to user-facing changes; `dist/` is
   untouched, so publishing a release would ship a no-op to consumers. Alternative —
   following the 1.10.1 precedent of releasing internal cleanups — rejected: that
   precedent covered release-tooling changes that consumers could observe in CI
   metadata; here nothing in the published package changes.

5. **New capability spec instead of modifying `linter-rule-coverage`.** Tooling
   currency is a distinct concern from preset rule coverage; adding it as
   `dev-tooling-currency` keeps `linter-rule-coverage` focused on the published
   presets. `@biomejs/biome` itself stays under `linter-rule-coverage`'s
   version-tracking requirement and is explicitly excluded from the new capability to
   avoid overlapping requirements.

## Risks / Trade-offs

- [OpenSpec 1.6.0 may restructure the generated assets or change workflow behavior]
  → Review the regen diff before committing; smoke-test with
  `openspec status --change track-latest-changes-1-10-2` and `openspec validate`.
- [npm `latest` can move between proposal and implementation] → Re-run the version
  checks at implementation time. If Biome publishes >2.5.3 mid-flight, the
  "Newer release available" scenario of `linter-rule-coverage` takes over and this
  change's scope grows to a full Biome upgrade (schema bumps, rule reconciliation,
  changeset) — that would warrant revisiting this proposal.
- [Global CLI update affects other repos on this machine] → Acceptable; OpenSpec
  assets in other repos regenerate on their own next `openspec update`.

## Migration Plan

Dev-tooling only; no deploy surface. Rollback = `git revert` of the regen commit plus
`pnpm add -g @fission-ai/openspec@1.5.0` if 1.6.0 misbehaves.

## Open Questions

- None blocking. The exact 1.6.0 regeneration subcommand is confirmed during
  implementation (Decision 2).
