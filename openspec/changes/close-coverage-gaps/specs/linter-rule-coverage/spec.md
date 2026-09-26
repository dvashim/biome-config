# Spec Delta

## ADDED Requirements

### Requirement: The rule-metadata snapshot is verified against the release it describes

The rule-metadata snapshot SHALL be verified against the Biome release it
describes — the version pinned in the presets' `$schema` URLs — on every run of
`pnpm run check`, whatever version of Biome is installed. When the installed
binary is that release, the check SHALL read the release from it. When it is not,
the check SHALL obtain the pinned release for the comparison rather than skipping
it. The verification SHALL NOT go inert while the installed binary and the pinned
target disagree. That split state is the normal trigger for a version-tracking
pass, and it is also the state in which a snapshot that names a release without
describing it would otherwise pass every invariant that reads the snapshot.

A check that cannot obtain the pinned release — because it is unreachable, or
because that version was never published — SHALL fail and state that the snapshot
could not be verified against it. It SHALL NOT report the snapshot as verified or
the comparison as skipped. Regeneration SHALL describe the same release the check
verifies against: it SHALL read the pinned target whatever version is installed,
and SHALL NOT write any other version's rules into the snapshot.

The snapshot SHALL cover every rule category the release's own configuration
schema declares, derived from that schema rather than from a list maintained
beside it, so that a category a later release introduces is covered by
construction. A declared category from which no rules can be read SHALL fail the
regeneration and the check, naming the category. It SHALL NOT be passed over.

#### Scenario: Versions agree

- **WHEN** the installed binary is the release the presets pin
- **THEN** the check verifies the snapshot against the installed binary without
  obtaining any other release, and needs no network access

#### Scenario: Snapshot is verified while the installed binary is ahead

- **WHEN** an automated devDependency bump has moved the installed Biome past the
  pinned target, and the snapshot correctly describes the pinned release
- **THEN** the check verifies the snapshot against the pinned release and passes,
  rather than reporting the comparison as skipped

#### Scenario: Relabelled snapshot fails verification

- **WHEN** every file that pins the target, and the version the snapshot records,
  name a published release whose rules the snapshot does not describe — for
  example, the pins were advanced and the snapshot's version relabelled without it
  being regenerated
- **THEN** the check fails reporting drift against that release, whatever version
  is installed

#### Scenario: Pinned release cannot be obtained

- **WHEN** the check needs a release other than the installed one and cannot
  obtain it, because there is no network access or the pinned version was never
  published
- **THEN** the check fails and names the release it could not verify against

#### Scenario: Regeneration reads the pinned target

- **WHEN** the snapshot is regenerated while the installed binary is a different
  release from the pinned target
- **THEN** the regenerated snapshot describes the pinned target and records its
  version

#### Scenario: Release declares a rule category not seen before

- **WHEN** the target release's configuration schema declares a rule category
  that no earlier release declared
- **THEN** the regenerated snapshot includes that category's rules, so the
  Coverage invariant evaluates them like any other rule

#### Scenario: Declared category yields no rules

- **WHEN** a category the configuration schema declares resolves to no group of
  rules that can be read
- **THEN** regeneration and the check both fail naming that category, rather than
  producing or accepting a snapshot without its rules

## MODIFIED Requirements

### Requirement: Presets track the latest stable Biome release

The presets SHALL target the latest stable `@biomejs/biome` release.
Reconciliation SHALL compare the version pinned in the presets' `$schema` URLs
against the npm `latest` dist-tag — not the version of the locally installed
binary — because an automated devDependency bump can advance the installed
version without touching the presets. When the pinned target already equals
`latest`, the `$schema` URLs and the `@biomejs/biome` dependency range are left
unchanged and only the rule lists are reconciled. When the pinned target lags
`latest`, the `$schema` URLs and the declared dependency range are advanced and
the rule set is re-derived, whether or not the installed binary has already
moved.

A pass that advances the target SHALL also regenerate the rule-metadata snapshot
against the new version. The snapshot is defined as describing the release the
presets target, so leaving it behind would make it describe a version the presets
no longer claim. The snapshot check verifies it against the pinned target on
every run, whatever version is installed, so a change that advances the target
without regenerating the snapshot fails that check.

#### Scenario: Already on latest

- **WHEN** the version pinned in the presets' `$schema` URLs equals the npm
  `latest` dist-tag
- **THEN** no `$schema` or dependency bump is made and the rule reconciliation
  proceeds against that version

#### Scenario: Newer release available

- **WHEN** a stable Biome release newer than the pinned `$schema` target exists
- **THEN** the `$schema` URLs (six dist files, `biome.json`, `README.md`) and the
  `@biomejs/biome` dependency are bumped, and the rule set is re-derived against
  the new version

#### Scenario: Installed binary is ahead of the pinned target

- **WHEN** an automated devDependency bump has already moved the installed Biome
  version to the npm `latest` dist-tag while the presets' `$schema` URLs still pin
  an older version
- **THEN** the pass treats the presets as lagging rather than as already current,
  and advances the `$schema` URLs and the declared `@biomejs/biome` range to that
  version before re-deriving the rule set against it

#### Scenario: Advancing the target regenerates the rule metadata

- **WHEN** a pass advances the pinned Biome target to a newer release
- **THEN** the rule-metadata snapshot is regenerated against that release in the
  same change, so the version it records agrees with every file that pins the
  target

#### Scenario: Target advances with no rule-metadata movement

- **WHEN** the new release declares the same rules with the same categories,
  severities, recommended statuses, domains, and example languages as the one it
  replaces
- **THEN** the regenerated snapshot differs only in the version it records, and
  that empty diff is recorded as the audit result rather than taken as evidence
  the audit was skipped

### Requirement: Mechanically decidable preset invariants are enforced by the build

The conditions the presets must satisfy that are decidable from the target
Biome release's own rule metadata SHALL be verified by an automated check that
runs as part of `pnpm run check`, and that check SHALL fail on drift. A
version-tracking pass SHALL NOT be the only thing that establishes them, because
a condition re-derived by hand once per pass is unverified between passes.

The set of preset files the checks cover SHALL be derived from the package's own
export map rather than maintained as a second list beside it, so that a preset the
package publishes is covered by construction and cannot be omitted by an
oversight. Where a path must still be named by hand — because a check refers to
one preset specifically — that name SHALL be verified against the derived set. A
preset the checks cannot resolve SHALL be reported as a named failure, never
allowed to abort the run: a check that dies on an unexpected input reports
nothing about the inputs it had already read.

The metadata SHALL describe the Biome release the presets **target** — the
version pinned in their `$schema` URLs — and SHALL cover, for every rule that
release declares, its category, recommended status, domains, default
severity, and the languages of its published examples. The check SHALL NOT be
keyed to the version of the locally installed binary: an automated devDependency
bump routinely moves the installed version ahead of the pinned target, and the
standing requirement already treats that split state as the trigger for a
version-tracking pass rather than as a defect.

The enforced invariants SHALL be:

- **Coverage** — every rule the target release declares is accounted for as one of:
  listed in `react-strict`; recommended, domain-free, and outside `nursery`, and so
  already active via `recommended: true`; belonging only to an excluded framework
  domain; targeting only an excluded language; or named in the exclusion ledger. A
  `nursery` rule SHALL NOT be accounted for as active through the recommended set
  even when the release reports it as recommended, because that set never
  activates `nursery`. Counting it as active would let a release's new rule go
  unlisted, reaching no consumer, while the check reports it accounted for.
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
  `react-strict`, nor recommended-with-no-domain outside `nursery`, nor
  framework-domain-only, nor excluded-language-only, nor named in the exclusion
  ledger
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

#### Scenario: Unlisted nursery rule reported as recommended is awaiting classification

- **WHEN** the target release declares a `nursery` rule that it reports as
  recommended and that has no domain, no preset lists it, neither its domains nor
  its example languages exclude it, and no ledger entry names it
- **THEN** the check fails and names it as awaiting classification, rather than
  counting it as already active via `recommended: true`

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

#### Scenario: Published preset is covered without being listed again

- **WHEN** the package's export map gains a preset
- **THEN** the checks cover it without any separate list of preset paths being
  edited, because that list is derived from the export map

#### Scenario: Hand-written preset path no longer resolves

- **WHEN** a check names a preset path directly and no published preset has that
  path — for example after a preset is renamed
- **THEN** the check fails naming that path, rather than silently checking nothing

#### Scenario: Unresolvable preset is reported, not thrown

- **WHEN** a check reaches a preset path it cannot resolve to a loaded preset
- **THEN** it records a named problem and continues, so the run still reports
  every other problem it found
