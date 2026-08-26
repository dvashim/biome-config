## ADDED Requirements

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
  lists in each category, every rule the README names exists in that preset, and
  the balanced relaxation table's published totals reconcile against the presets.
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

- **WHEN** a preset rule list changes without the README's counts, named rules, or
  relaxation totals being updated to match
- **THEN** the check fails and reports the mismatch

#### Scenario: Version bump is applied to only some of the pinned files

- **WHEN** a pass advances the pinned Biome target but leaves at least one
  `dist/*.json` preset, the root `biome.json`, or a `README.md` version reference
  naming the previous version
- **THEN** the check fails and names the files that disagree

## MODIFIED Requirements

### Requirement: Out-of-scope rules are excluded

The presets SHALL NOT enumerate GraphQL language rules, nor rules whose only
applicable domain is `vue`, `solid`, `qwik`, `svelte`, or `astro`.

Both exclusions SHALL be derived from the target release's own rule metadata
rather than from a maintained list. A rule's domains are published directly, so
the framework-domain exclusion SHALL follow from them and SHALL extend
automatically to any framework-only domain a later Biome release introduces. A
rule's target language is published only in its documented examples, each of
which names the language it is written in; the language exclusion SHALL be
derived from those, treating a rule as GraphQL-only when every example it
publishes is GraphQL.

Derivation SHALL NOT be assumed total. A rule that publishes no example in any
language — a configuration-required rule whose only documented block is its own
options sample — cannot be classified this way. Any rule the metadata cannot
place SHALL be recorded in an exclusion ledger naming the rule and the reason it
is out of scope, and the ledger SHALL be the only sanctioned way to account for
such a rule, so that an unrecorded one is reported as awaiting classification
rather than being silently absent. The ledger SHALL hold no entry for a rule
that derivation already classifies.

#### Scenario: Non-React framework rule is excluded

- **WHEN** a rule's only domain is `vue`/`solid`/`qwik`/`svelte`/`astro`, or the
  rule is GraphQL-only
- **THEN** it is absent from both presets

#### Scenario: Framework-only domain exclusion is derived from metadata

- **WHEN** a Biome release introduces a domain for a framework the presets do not
  target, and adds rules whose only domain is that one
- **THEN** those rules are excluded on the strength of their published domains,
  without an entry being added to the exclusion ledger

#### Scenario: GraphQL exclusion is derived from the rule's published examples

- **WHEN** every example a rule publishes is written in GraphQL
- **THEN** it is excluded as a GraphQL language rule on the strength of those
  examples, without an entry being added to the exclusion ledger

#### Scenario: Rule the metadata cannot classify is recorded in the ledger

- **WHEN** a rule publishes no example in any language, so neither its domains
  nor its examples place it in or out of scope
- **THEN** it is named in the exclusion ledger together with the reason it is out
  of scope, rather than being assumed either way

#### Scenario: Unrecorded out-of-scope rule is reported, not assumed

- **WHEN** a Biome release adds a rule that is neither listed in the presets, nor
  active via `recommended: true`, nor excludable from its domains or its example
  languages, and no ledger entry names it
- **THEN** it is reported as awaiting classification, so the decision to exclude
  it is made deliberately and recorded
