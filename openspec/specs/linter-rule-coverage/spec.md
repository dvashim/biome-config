# linter-rule-coverage Specification

## Purpose
TBD - created by archiving change add-missing-optin-rules. Update Purpose after archive.

## Requirements

### Requirement: In-scope non-recommended rules are explicitly enabled

The `react-strict` and `react-balanced` presets SHALL explicitly enable every Biome linter rule that both (a) targets `js`, `ts`, `css`, `html`, `json`, or `jsonc`, or belongs to the React, Next.js, React Native, `test`, or `project` domains, and (b) is not part of Biome's default `recommended` set of stable rules. Nursery rules are treated as in scope because `recommended: true` does not activate them.

Clause (a) is a **disjunction** and SHALL be evaluated as one: a rule qualifies
through its target language *or* through its domains. The domains named there are
not an exhaustive list of the domains the presets may carry — Biome declares
others, including `types`, `playwright`, `drizzle`, `tailwind`, and `turborepo` —
so a rule belonging only to an unnamed domain is in scope whenever its target
language qualifies, and SHALL NOT be treated as out of scope on the strength of
its domain alone.

#### Scenario: Absent in-scope opt-in rule is added

- **WHEN** a Biome rule is in scope and is not enabled by `recommended: true`
- **THEN** it appears in both `dist/biome.react-strict.json` and `dist/biome.react-balanced.json` with an explicit severity

#### Scenario: Audit finds no in-scope gap

- **WHEN** the presets are diffed against the Biome rule set filtered to scope
- **THEN** no in-scope, non-recommended rule is missing from the explicit list

#### Scenario: Rule in an unnamed domain qualifies through its language

- **WHEN** a rule belongs only to a domain clause (a) does not name, and targets
  one of the languages clause (a) does name
- **THEN** it is in scope, and a scope check SHALL NOT flag it on the basis that
  its domain is unnamed

### Requirement: Framework rules are enabled by explicit listing

Because the presets do not declare a `domains` key, rules belonging to any
dependency-gated Biome domain — React Native, Next.js, Playwright, Drizzle,
Tailwind, and any domain Biome adds later — SHALL be activated by listing each
rule individually in `linter.rules`, not via Biome domain auto-detection. For most
such rules this defeats the dependency gate, and the presets SHALL acknowledge
that the rule then fires for every consumer, including those that do not use the
framework the domain gates on. This SHALL NOT be assumed universal: a rule may
additionally gate itself on its dependency at runtime, so that explicit listing
does not make it run for consumers lacking that dependency. `react-balanced` SHALL
relax a listed rule when it is broadly firing for the consumers who do receive it
— whether the noise comes from outside the framework (a rule that flags every
`<img>`) or from inside it, by flagging a practice the framework itself sanctions.

#### Scenario: React Native rule with no Biome domain is enabled

- **WHEN** a React Native rule has no corresponding Biome domain
- **THEN** it is enabled by an explicit `linter.rules` entry rather than a domain setting

#### Scenario: Dependency-gated domain rule is enabled unconditionally

- **WHEN** a rule belongs to a domain Biome activates only on detecting a
  dependency (e.g. `tailwind` on `tailwindcss`) and the rule does not itself
  re-check for that dependency
- **THEN** the presets list the rule explicitly, so it applies regardless of the
  consumer's dependencies, and the pass evaluates the resulting noise for
  consumers who do not use that framework

#### Scenario: Broadly-firing framework rule is relaxed in balanced

- **WHEN** a listed framework rule fires on patterns common outside its framework
  (e.g. `noImgElement` on any `<img>`)
- **THEN** `react-balanced` lists it at a relaxed severity (`info` or `off`)
  while `react-strict` keeps it at `warn`

#### Scenario: Rule that flags a sanctioned in-framework practice is relaxed in balanced

- **WHEN** a listed domain rule reports a pattern the framework itself offers as
  a supported escape hatch, so it fires repeatedly in real projects that use the
  framework correctly (e.g. Tailwind arbitrary values)
- **THEN** `react-balanced` lists it at a relaxed severity (`info` or `off`)
  while `react-strict` keeps it at `warn`

### Requirement: Redundant recommended rules are not enumerated

The presets SHALL NOT list a recommended **stable** rule at its Biome default severity, because such a rule is already active through `recommended: true`.

#### Scenario: Recommended-stable-at-default is omitted

- **WHEN** a recommended stable rule would be listed at its Biome default severity with no options
- **THEN** the entry is removed from the explicit rule list and the rule remains active via `recommended: true`

### Requirement: Deliberate overrides of recommended rules are preserved

The presets MAY list a recommended rule when the intent is to override Biome's default — disabling it (`off`), changing its severity, or supplying options. Such entries SHALL be retained even though the rule is recommended.

#### Scenario: Disabled recommended rule is kept

- **WHEN** a recommended rule is listed as `off` or at a non-default severity or with options
- **THEN** the entry remains in the preset because removing it would change behavior

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

### Requirement: Stable variants exclude nursery rules

The `react-strict-stable` and `react-balanced-stable` presets SHALL be mechanically derived from their parents with all nursery rules removed, via `scripts/sync-stable.ts`, and SHALL NOT be edited by hand.

#### Scenario: Stable variants stay in sync

- **WHEN** `pnpm sync-stable` runs after the parent presets change
- **THEN** each `-stable` file equals its parent minus the nursery category, and `pnpm check` reports no drift

### Requirement: Graduated nursery rules retain their severity on relocation

When Biome reclassifies a rule that the presets list under `nursery` into another (stable) category, the presets SHALL move the rule entry into the new category while preserving the exact severity and options the preset had assigned, evaluated independently for `react-strict` and `react-balanced`. A relocated rule SHALL NOT be reset to Biome's default severity.

#### Scenario: Nursery rule graduates to a stable category

- **WHEN** a Biome release moves a listed rule out of `nursery` into another category
- **THEN** the rule is relocated to that category in each preset at the same severity it previously held under `nursery`

#### Scenario: Relaxed balanced severity survives relocation

- **WHEN** the relocated rule had been relaxed in `react-balanced` (e.g. `off` or `info`)
- **THEN** the relocated entry in `react-balanced` keeps that relaxed severity rather than reverting to `react-strict`'s level or Biome's default

### Requirement: Renamed or removed rules are migrated on upgrade

When a Biome upgrade renames a listed rule, the presets SHALL replace the old name with the new name while preserving the assigned severity and options. When an upgrade removes a listed rule with no replacement, the presets SHALL drop it.

#### Scenario: Rule renamed across versions

- **WHEN** a listed rule was renamed in the target Biome version (e.g. `noMultiStr` → `noMultilineString`)
- **THEN** the preset lists the new name at the same severity the old name had

#### Scenario: Rule removed without replacement

- **WHEN** a listed rule no longer exists in the target version and has no successor
- **THEN** it is removed from both presets

### Requirement: Severity convention for added rules

Added rules SHALL default to `warn` in `react-strict`. `react-balanced` SHALL relax purely stylistic, high-noise, or broadly-firing framework additions to `info` or `off`, consistent with the existing balanced relaxations.

#### Scenario: Added rule follows the house convention

- **WHEN** a rule is added to the presets
- **THEN** `react-strict` lists it at `warn` and `react-balanced` lists it at `warn` or a relaxed level

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

### Requirement: Rules requiring configuration are listed without options

A rule that emits no diagnostics until the consumer supplies options — the
`noRestricted*` family and any future rule whose entry list is project-specific —
SHALL still be listed in `react-strict` and `react-balanced` at a bare severity
string with no `options` block. Listing it keeps the rule discoverable and lets a
consumer activate it by supplying only its options, while the presets decline to
impose a restriction policy of their own. The presets SHALL NOT ship default
entries for such a rule.

#### Scenario: Configuration-required rule is added

- **WHEN** an in-scope rule reports nothing until the consumer supplies an options
  entry list
- **THEN** both presets list it at a bare severity string with no `options` key

#### Scenario: Inert rule keeps the same severity in balanced

- **WHEN** such a rule is added and reports nothing under the presets' own
  configuration
- **THEN** `react-balanced` lists it at the same severity as `react-strict`,
  because a rule that is silent by default is neither high-noise nor
  broadly-firing

### Requirement: New rule options are adopted only to override an upstream default

A version-tracking pass SHALL audit the target Biome release for new
configuration options on rules the presets already list, in addition to auditing
new rules, and SHALL record the outcome for each option found. The presets SHALL
add an `options` block to an already-listed rule only when the preset's intent
differs from the option's upstream default. When the default matches the preset's
intent, the entry SHALL remain a bare severity string, so the presets keep
inheriting Biome's default — including any later change to it — rather than
freezing a value that merely restates it.

#### Scenario: New option's default matches the preset's intent

- **WHEN** a Biome release adds an option to a rule the presets already list and
  the option's default behavior is what the presets want
- **THEN** the rule entry stays a bare severity string with no `options` key, and
  the pass records that the option was audited and deliberately not set

#### Scenario: New option's default conflicts with a preset's intent

- **WHEN** the new option's default produces behavior a preset does not want
- **THEN** that preset — `react-strict`, `react-balanced`, or both, decided
  independently — lists the rule with an explicit `options` block setting only
  that option, and the now object-valued entry is placed after the category's
  string-valued entries

#### Scenario: Upstream behavior change is inherited, not masked

- **WHEN** a new option accompanies a change to what the rule reports by default
- **THEN** the presets inherit the new default and the change is recorded as
  consumer-visible impact of the Biome bump, rather than being suppressed by
  setting the option

### Requirement: Balanced relaxations may live in nursery

`react-balanced` SHALL apply the severity convention to nursery rules on the same
terms as stable ones, relaxing a nursery addition to `info` or `off` when it is
purely stylistic, high-noise, or broadly firing. Such a relaxation SHALL NOT
reach `react-balanced-stable`, because the `-stable` variants are derived by
stripping nursery. The README SHALL therefore report the count of balanced
relaxations separately from the subset that applies to `react-balanced-stable`,
and SHALL NOT assert that every relaxation lives in a stable category once one
does not.

#### Scenario: Nursery rule is relaxed in balanced

- **WHEN** a nursery rule meets the balanced relaxation criteria
- **THEN** `react-balanced` lists it at `info` or `off` while `react-strict`
  keeps it at `warn`, and both `-stable` variants are unaffected because
  `pnpm sync-stable` strips the category the relaxation lives in

#### Scenario: README distinguishes the two relaxation counts

- **WHEN** at least one balanced relaxation lives in `nursery`
- **THEN** the README's `react-balanced` entry reports the total relaxation
  count, its `react-balanced-stable` entry reports only the stable-category
  subset, and no README statement claims all relaxations carry into the
  `-stable` variant

### Requirement: A listed domain rule's gating behavior is established empirically

A pass that adds a rule belonging to a dependency-gated domain SHALL determine, by
observation rather than inference, whether explicit listing actually causes the
rule to run for a consumer without the gating dependency. The pass SHALL run the
rule against a fixture with the dependency absent and a fixture with it present,
and SHALL record which behavior was observed. The result determines which
consumers receive the rule's diagnostics, and therefore both whether a
`react-balanced` relaxation is warranted and whose runs pay for the rule — so it
SHALL NOT be assumed from how other rules in the same domain behave. Establishing
that a rule reaches every consumer SHALL NOT by itself decide the relaxation:
reach and noise are separate findings, because a rule whose trigger pattern is
itself framework-specific can reach a consumer without matching anything there.
The pass SHALL therefore measure what a gate-defeating rule actually reports for
consumers outside the framework before concluding that a relaxation is warranted.

#### Scenario: Listed domain rule ignores the dependency gate

- **WHEN** a listed domain rule is run against a project lacking the dependency
  its domain gates on, and it still reports
- **THEN** the pass records that the rule reaches every consumer, and assesses its
  noise for consumers who do not use that framework

#### Scenario: Listed domain rule enforces its own dependency gate

- **WHEN** a listed domain rule reports nothing for a project lacking its gating
  dependency but reports for one that has it
- **THEN** the pass records that explicit listing did not defeat the gate, and
  scopes both the noise assessment and any relaxation decision to consumers who
  have that dependency

#### Scenario: Gate-defeating rule matches nothing outside its framework

- **WHEN** a listed domain rule defeats its dependency gate, but its trigger
  pattern is specific to the framework's own syntax (e.g. Tailwind utility class
  names), and it is measured against real projects that lack the framework
- **THEN** the pass records that the rule reaches every consumer while reporting
  nothing for those outside the framework, and `react-balanced` lists it at the
  same severity as `react-strict`, because a rule that is silent for the consumers
  it over-reaches is neither high-noise nor broadly-firing

#### Scenario: Cost is attributed to the consumers who actually run the rule

- **WHEN** a rule embeds a whole-program analysis engine rather than a syntactic
  pattern match
- **THEN** the pass measures its added run time against the population the gating
  result says will actually execute it, and records that measurement rather than
  asserting the cost is universal

### Requirement: Upstream behavior changes are audited from the release notes

A version-tracking pass SHALL audit the target Biome release's notes for changes
to behavior the presets already activate — what an already-listed or
already-recommended rule reports, what the formatter emits for a language the
presets configure, and what the parsers accept — in addition to auditing new rules
and new options. A configuration-schema diff cannot detect these changes, so the
audit SHALL NOT be treated as covered by the schema comparison. Any such change
that alters output for a consumer who makes no configuration change SHALL be
recorded in the change and named in the changeset alongside the rule-list change,
so a release does not present itself as only a rule-list change while altering the
output of presets whose rule lists did not move.

#### Scenario: Formatter output changes for a configured language

- **WHEN** the target release changes what the formatter emits for a language the
  presets configure, such as HTML
- **THEN** the pass records the change and the changeset names it, including for
  the `recommended`, `react-recommended`, and `-stable` presets whose rule lists
  the same release leaves unchanged

#### Scenario: Parser accepts syntax it previously rejected

- **WHEN** the target release widens what a parser accepts, so a rule the presets
  list can now analyze input it previously failed on
- **THEN** the pass records which listed rules change what they see, rather than
  concluding from the unchanged schema that the rules are unaffected

#### Scenario: Already-active rule reports fewer diagnostics

- **WHEN** the target release fixes a false positive in a rule the presets list or
  that is active through `recommended: true`
- **THEN** the pass records the change as inherited and takes no action, because
  the presets track upstream behavior rather than pinning it

#### Scenario: Release notes report no behavior change

- **WHEN** the release notes describe no change to an already-active rule, a
  configured formatter, or a parser
- **THEN** the pass records that the audit ran and found nothing, so the absence
  is distinguishable from the audit having been skipped

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

### Requirement: A rule's analysis scope is established empirically

A rule whose diagnostics depend on resolving a definition — a CSS custom
property, a class name, a token, an import — SHALL have the **scope** of that
resolution established empirically before it is leveled in the presets, by
running the rule against a fixture whose definition and use sit in different
files. The result SHALL be recorded, because it is not derivable from the rule's
category, its domains, or its documentation: a rule may resolve across a project,
across a file, or not at all, and the description rarely says which.

A rule that reports **correct** code because the definition it cannot find lives
in another file SHALL be treated as broadly firing for the purposes of the
balanced relaxation, regardless of its domain, and SHALL be relaxed in
`react-balanced` to `info` or `off`. This is a distinct ground from the stylistic
and framework-breadth criteria: those relax a rule that fires accurately on code
some projects accept, whereas this one relaxes a rule that fires on code no
project should have to change.

Whether the rule publishes an **option** to declare externally-defined names SHALL
be checked and recorded as part of the same finding. A rule that can be told about
its environment is configurable rather than broadly firing, and SHALL NOT be
relaxed on this ground alone; a rule with no such option offers the consumer no
recourse short of disabling it.

A fallback syntax SHALL NOT be assumed to suppress the diagnostic. Where a
language provides one — `var(--x, fallback)` and its equivalents — whether the
rule honours it SHALL be established by the same fixture rather than inferred
from the language's semantics.

#### Scenario: Cross-file resolution is tested before leveling

- **WHEN** a pass adds a rule that reports a name it cannot resolve to a
  definition
- **THEN** the pass runs it against a fixture whose definition and use are in
  different files, and records whether the diagnostic fires

#### Scenario: Rule that cannot resolve across files is relaxed in balanced

- **WHEN** such a rule reports a use whose definition exists in another file of
  the same project, and the rule publishes no option to declare that definition
- **THEN** `react-strict` lists it at `warn` and `react-balanced` lists it at
  `info` or `off`, on the ground that it fires on correct code

#### Scenario: Configurable rule is not relaxed on this ground

- **WHEN** such a rule publishes an option that lets the consumer declare
  externally-defined names
- **THEN** the analysis-scope finding alone does not justify a balanced
  relaxation, and the rule is leveled on the ordinary criteria

#### Scenario: Fallback syntax is tested rather than assumed

- **WHEN** the language offers a fallback form for an unresolved name
- **THEN** the pass establishes by fixture whether the rule treats the fallback
  as satisfying the reference, and does not assume it does
