# Proposal

## Why

Teams that extend a preset should get each new Biome release's related rules from
the preset itself, for every release from now on, with every update that moves the
package to a new release bringing that release's rules along. The repository's
checks can currently pass such an update without those rules in three ways, and
this change closes all three. Intent: `intent.md`, a slice of
`docs/intents/0001-keep-presets-current.md`.

## What Changes

- **Coverage stops counting nursery rules as already active.** Coverage treats a
  rule as accounted for "via `recommended: true`" whenever it is recommended and
  domain-free, and it never checks the category. The recommended set never
  activates `nursery`, yet `biome explain` reports 11 of the 119 nursery rules in
  2.5.14 as recommended. Three of those 11 are among the six rules the 2.5.14 pass
  added (`noJsonUnsafeValues`, `noReturnInFinally`, `useConsistentObjectKeys`).
  Replaying that pass with the six unlisted, coverage names only the other three.
  The recommended exemption becomes recommended, domain-free, **and outside
  `nursery`**, the same rule the redundancy invariant already applies. All 11
  such rules are listed today, so no current verdict changes.
- **The rule catalogue is verified against the release it describes on every
  run.** `check:rule-metadata` skips whenever the installed binary differs from
  the pinned target. If every pinned file and the snapshot are relabelled to a
  version that was never swept, every check passes: `presets check out against
  Biome 2.5.15 … 0 unaccounted`. Instead, the check sweeps the pinned target
  itself, using the installed binary when it is that release and fetching the
  release otherwise. When it cannot obtain the release, it fails and names the
  reason. Regeneration (`pnpm sync-rule-metadata`) resolves the target the same
  way, so it no longer refuses to run while the versions disagree.
- **The sweep enumerates every rule category the release declares.** It reads the
  categories from the configuration schema's `Rules` definition instead of a
  hard-coded list of eight. It fails, naming the category, when a declared
  category has no rule group it can read, so a release that adds a category
  cannot drop that category's rules unnoticed.
- **`CLAUDE.md` is corrected** where it describes the old behavior: `--check`
  skipping, the sweep refusing a mismatched binary, the `--biome` override
  regeneration needed, and the nursery-"recommended" guard as a redundancy-only
  concern.
- **No preset, README, or release change.** `dist/*.json` and `README.md` stay
  byte-identical, so the standing changeset-sizing requirement calls for no
  changeset.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`:
  - *Mechanically decidable preset invariants are enforced by the build*: the
    Coverage invariant's recommended exemption excludes `nursery`, with a scenario
    for an unlisted nursery rule reported as recommended.
  - *Presets track the latest stable Biome release*: its statement that the
    snapshot drift check is inert while the target and the installed binary
    disagree is replaced, because the check no longer goes inert.
  - Added: *The rule catalogue is verified against the release it describes*,
    which covers verification on every run whatever version is installed, failure
    when the target release cannot be obtained, and enumeration of every category
    the release declares.

## Impact

- `scripts/check-presets.ts`: the Coverage invariant's recommended clause.
- `scripts/sync-rule-metadata.ts`: how the target's binary is resolved in both
  modes, and category enumeration.
- `CLAUDE.md`: the commands list, the `audit/` section, and the version-upgrade
  convention.
- `openspec/specs/linter-rule-coverage/spec.md`: updated from this change's delta
  at archive.
- Not touched: `dist/*.json`, `README.md`, `audit/rule-exclusions.json`,
  `package.json`, `pnpm-lock.yaml`, and the workflows. The `check:*` fan-out picks
  up the new behavior without a workflow edit. `audit/rule-metadata.json` must
  come out byte-identical when regenerated with the new enumeration.
- CI and local runs: while the installed Biome and the pinned target disagree (an
  automated bump has moved the binary ahead and no pass has levelled them yet),
  `check:rule-metadata` fetches the target release and sweeps it. That took 24 s
  locally, against 11 s with the installed binary, and it needs network access to
  the npm registry and biomejs.dev. When the versions agree, it runs as it does
  today.
- Consumers: none. No published file changes.
