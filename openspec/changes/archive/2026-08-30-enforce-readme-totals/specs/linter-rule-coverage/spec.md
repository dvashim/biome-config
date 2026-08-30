## MODIFIED Requirements

### Requirement: README rule inventory matches the presets

The README's per-category rule counts SHALL equal the number of rules the
`react-strict` preset lists in that category, and every rule named in a README
category description or highlights list SHALL exist in that preset. Every
**preset total** the README publishes — in the Configurations table's count
columns and in the prose that introduces the ladder — SHALL equal the number of
rules that preset lists, and the Configurations table SHALL carry one row per
published preset, so a preset cannot ship undocumented. A change that alters a
preset rule list SHALL update the affected counts, totals, and any now-stale rule
names in the same change.

Per-category counts SHALL NOT be treated as evidence for a total: they are
published in a different place, in a different shape, and a change that
reconciles one can leave the other stale. A published count SHALL be reconciled
against the presets wherever it appears, not only where it is convenient to
match.

#### Scenario: Rule-list change updates the category count

- **WHEN** a change adds or removes a rule in a category whose README entry
  publishes a rule count (e.g. `nursery (71 rules)`)
- **THEN** that count is updated in the same change to match the number of rules
  the category holds in `dist/biome.react-strict.json`

#### Scenario: Highlights name only rules the preset lists

- **WHEN** the README names a rule in a category description or highlights list
- **THEN** that rule is present in `dist/biome.react-strict.json` under that
  category, and a rule that was renamed or removed upstream is renamed or dropped
  from the README in the same change that reconciles the preset

#### Scenario: Published preset total is reconciled

- **WHEN** a change alters the number of rules a preset lists and the README
  publishes that preset's total
- **THEN** every published total for that preset is updated in the same change,
  in the Configurations table and in the ladder prose alike

#### Scenario: Configurations table covers every published preset

- **WHEN** the package publishes a preset that the Configurations table has no row
  for, or the table carries a row for a preset the package does not publish
- **THEN** the check fails and names the preset

#### Scenario: Retired prose matcher fails rather than passing silently

- **WHEN** README prose that a published count was read from is reworded so the
  check's matcher finds nothing
- **THEN** the check fails reporting that it has no count to check, rather than
  passing because it found no mismatch

### Requirement: Version-tracking passes release according to their published impact

A Biome version-tracking pass, and any other change, SHALL create a Changesets
release when it edits the consumer-facing published surface — any `dist/*.json`
preset or `README.md` — and SHALL NOT create a changeset when it edits only dev
dependencies (including the `@biomejs/biome` devDependency range), the root
`biome.json`, planning artifacts, or OpenSpec-generated tooling assets while
leaving every `dist/*.json` preset and `README.md` unchanged. When such a
release only advances the pinned `$schema` target to a newer stable Biome
version and makes no preset rule-list change, it SHALL be a `patch`. When the
release also changes a preset rule list — adding, removing, renaming, or
re-leveling a rule in `react-strict` or `react-balanced` — it SHALL be a
`minor`, because the diagnostics consumers receive change. When a release edits
`README.md` alone — correcting published prose or a published count with no
preset rule-list change and no advance of the pinned `$schema` target — it SHALL
be a `patch`, because `README.md` reaches consumers through the npm package page
whether or not it is named in the package's `files` list.

#### Scenario: Newer-release bump ships as a patch

- **WHEN** a pass advances the `$schema` URLs in the six `dist/*.json` presets
  (together with `biome.json` and `README.md`) to a newer stable Biome version and
  makes no change to the preset rule lists
- **THEN** a `patch` changeset is created that names the new target version

#### Scenario: Rule-list change ships as a minor

- **WHEN** a pass adds, removes, renames, or changes the severity of a rule in
  `dist/biome.react-strict.json` or `dist/biome.react-balanced.json`
- **THEN** a `minor` changeset is created that names the affected rules, even when
  the same pass also advances the `$schema` target

#### Scenario: Dev-only or no-op pass creates no changeset

- **WHEN** a pass leaves every `dist/*.json` preset and `README.md` unchanged — for
  example it confirms the presets already target the npm `latest` Biome release, or
  it only bumps dev dependencies or regenerates tooling assets
- **THEN** no changeset is created and no release is published

#### Scenario: Documentation-only correction ships as a patch

- **WHEN** a change edits `README.md` without changing any preset rule list and
  without advancing the pinned `$schema` target — for example correcting a
  published rule count that drifted from the presets
- **THEN** a `patch` changeset is created that names what the correction fixes

### Requirement: Mechanically decidable preset invariants are enforced by the build

The conditions the presets must satisfy that are decidable from the target
Biome release's own rule metadata SHALL be verified by an automated check that
runs as part of `pnpm run check`, and that check SHALL fail on drift. A
version-tracking pass SHALL NOT be the only thing that establishes them, because
a condition re-derived by hand once per pass is unverified between passes.

The metadata SHALL describe the Biome release the presets **target** — the
version pinned in their `$schema` URLs — and SHALL cover, for every rule that
release declares, its category, recommended status, domains, default
severity, and the languages of its published examples. The check SHALL NOT be keyed to the version of the locally installed
binary: an automated devDependency bump routinely moves the installed version
ahead of the pinned target, and the standing requirement already treats that
split state as the trigger for a version-tracking pass rather than as a
defect.

The enforced invariants SHALL be:

- **Coverage** — every rule the target release declares is accounted for as one of:
  listed in `react-strict`; recommended with no domain, and so already active via
  `recommended: true`; belonging only to an excluded framework domain; targeting
  only an excluded language; or named in the exclusion ledger.
- **Category placement** — every rule a preset lists is listed under the category
  the target release reports for it.
- **Rule existence** — every rule a preset lists still exists in the target
  release.
- **Redundancy** — no preset lists a rule that is recommended, domain-free,
  outside `nursery`, and at its Biome default severity with no options.
- **Preset parity** — `react-strict` and `react-balanced` list identical rule
  sets, differing only in severity and options.
- **README inventory** — the README's per-category counts equal what `react-strict`
  lists in each category, every rule the README names exists in that preset, the
  balanced relaxation table's published totals reconcile against the presets, and
  every published **preset total** — the Configurations table's count columns and
  the ladder prose — equals what that preset lists, with one table row per
  published preset. A matcher that reads a published count SHALL fail when it
  matches nothing, so rewording the text around a count cannot silently retire
  its check.
- **Listed-rule scope** — every rule a preset lists is in scope: it targets a
  language the presets cover, or belongs to an in-scope domain, or the ledger
  records it as in scope. This runs opposite to **Coverage**, which a listed rule
  satisfies merely by being listed and so cannot detect a rule that does not
  belong.
- **Pinned-target consistency** — the version the rule metadata describes, the
  version pinned in the `$schema` URL of every `dist/*.json` preset and of the
  root `biome.json`, and every Biome version reference in `README.md` all name the
  same release.

#### Scenario: Unclassifiable rule fails the check

- **WHEN** the target Biome release contains a rule that is neither listed in
  `react-strict`, nor recommended-with-no-domain, nor framework-domain-only, nor
  excluded-language-only, nor named in the exclusion ledger
- **THEN** the check fails and names the rules awaiting classification, so a
  coverage gap surfaces at build time rather than at the next version-tracking pass

#### Scenario: Graduated rule is detected by category mismatch

- **WHEN** a Biome release moves a listed rule out of `nursery` into a stable
  category and the presets still list it under `nursery`
- **THEN** the check fails and reports the category the release assigns to it

#### Scenario: Renamed or removed rule is detected

- **WHEN** a preset lists a rule the target Biome release does not recognize
- **THEN** the check fails and names that rule

#### Scenario: Redundant recommended entry is detected

- **WHEN** a preset lists a stable rule that is recommended, has no domain, and
  carries the release's default severity with no options
- **THEN** the check fails, because the entry is already implied by
  `recommended: true`

#### Scenario: Nursery rule reported as recommended is not redundant

- **WHEN** a rule the release reports as recommended belongs to `nursery` and a
  preset lists it
- **THEN** the check treats the entry as required rather than redundant, because
  `recommended: true` does not activate nursery rules

#### Scenario: Preset rule sets diverge

- **WHEN** a rule is present in `react-strict` but absent from `react-balanced`,
  or the reverse
- **THEN** the check fails, because the two presets differ only in severity and
  options

#### Scenario: README inventory falls out of step

- **WHEN** a preset rule list changes without the README's per-category counts,
  published preset totals, named rules, or relaxation totals being updated to
  match
- **THEN** the check fails and reports the mismatch

#### Scenario: Version bump is applied to only some of the pinned files

- **WHEN** a pass advances the pinned Biome target but leaves at least one
  `dist/*.json` preset, the root `biome.json`, or a `README.md` version reference
  naming the previous version
- **THEN** the check fails and names the files that disagree

#### Scenario: Listed rule does not belong

- **WHEN** a preset lists a rule whose every published example is in an excluded
  language, or whose every domain is an excluded framework domain, and no ledger
  entry records it as in scope
- **THEN** the check fails and names that rule
