## MODIFIED Requirements

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

