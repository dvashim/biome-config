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
no longer claim — and it is what re-arms the snapshot drift check, which is inert
while the target and the installed binary disagree.

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
place SHALL be recorded in a ledger naming the rule, the reason, and a
**direction** — whether the rule is in scope or out of it. The direction is
required because a rule the metadata cannot classify may be correctly *listed*
rather than correctly absent, and a ledger that can only record exclusions cannot
say so. The ledger SHALL be the only sanctioned way to account for such a rule in
either direction, so that an unrecorded one is reported as awaiting
classification rather than being silently absent or silently present, and it
SHALL hold no entry for a rule that derivation already classifies.

Excluding a framework's rules SHALL NOT be read as excluding its files. The
presets lint every file the installed Biome can parse, so a consumer with files
of an excluded framework still receives that framework's parser and formatter
behaviour. A pass SHALL therefore disclose upstream work on an excluded framework
when it reaches those files, rather than treating the framework's exclusion from
the rule lists as a reason to omit it.

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
- **THEN** it is named in the ledger together with its direction and the reason,
  rather than being assumed either way

#### Scenario: Unrecorded out-of-scope rule is reported, not assumed

- **WHEN** a Biome release adds a rule that is neither listed in the presets, nor
  active via `recommended: true`, nor excludable from its domains or its example
  languages, and no ledger entry names it
- **THEN** it is reported as awaiting classification, so the decision to exclude
  it is made deliberately and recorded

#### Scenario: Ledger records a listed rule as in scope

- **WHEN** a rule the metadata cannot classify is one the presets list
  deliberately, because it targets a language the presets cover even though it
  publishes no example to prove it
- **THEN** its ledger entry records the direction *in scope*, and the rule stays
  listed rather than being reported as a rule that does not belong

#### Scenario: Excluded framework's parser work still reaches consumers

- **WHEN** a Biome release's changes are concentrated in the parser or formatter
  for a framework whose rules the presets exclude, and the presets process files
  of that framework
- **THEN** the pass records that those changes reach consumers who have such
  files, and the release notes the change publishes say so
