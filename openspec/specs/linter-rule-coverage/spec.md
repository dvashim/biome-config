# linter-rule-coverage Specification

## Purpose
TBD - created by archiving change add-missing-optin-rules. Update Purpose after archive.

## Requirements

### Requirement: In-scope non-recommended rules are explicitly enabled

The `react-strict` and `react-balanced` presets SHALL explicitly enable every Biome linter rule that both (a) targets `js`, `ts`, `css`, `html`, `json`, or `jsonc`, or belongs to the React, Next.js, React Native, `test`, or `project` domains, and (b) is not part of Biome's default `recommended` set of stable rules. Nursery rules are treated as in scope because `recommended: true` does not activate them.

#### Scenario: Absent in-scope opt-in rule is added

- **WHEN** a Biome rule is in scope and is not enabled by `recommended: true`
- **THEN** it appears in both `dist/biome.react-strict.json` and `dist/biome.react-balanced.json` with an explicit severity

#### Scenario: Audit finds no in-scope gap

- **WHEN** the presets are diffed against the Biome rule set filtered to scope
- **THEN** no in-scope, non-recommended rule is missing from the explicit list

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

The presets SHALL NOT enumerate GraphQL language rules, nor rules whose only applicable domain is `vue`, `solid`, `qwik`, `svelte`, or `astro`.

#### Scenario: Non-React framework rule is excluded

- **WHEN** a rule's only domain is `vue`/`solid`/`qwik`/`svelte`/`astro`, or the rule is GraphQL-only
- **THEN** it is absent from both presets

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

### Requirement: Version-tracking passes release according to their published impact

A Biome version-tracking pass SHALL create a Changesets release when it edits the
consumer-facing published surface — any `dist/*.json` preset or `README.md` — and
SHALL NOT create a changeset when it edits only dev dependencies (including the
`@biomejs/biome` devDependency range), the root `biome.json`, planning artifacts,
or OpenSpec-generated tooling assets while leaving every `dist/*.json` preset and
`README.md` unchanged. When such a release only advances the pinned `$schema`
target to a newer stable Biome version and makes no preset rule-list change, it
SHALL be a `patch`. When the release also changes a preset rule list — adding,
removing, renaming, or re-leveling a rule in `react-strict` or `react-balanced` —
it SHALL be a `minor`, because the diagnostics consumers receive change.

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

### Requirement: README rule inventory matches the presets

The README's per-category rule counts SHALL equal the number of rules the
`react-strict` preset lists in that category, and every rule named in a README
category description or highlights list SHALL exist in that preset. A change that
alters a preset rule list SHALL update the affected counts and any now-stale rule
names in the same change.

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
SHALL NOT be assumed from how other rules in the same domain behave.

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

#### Scenario: Cost is attributed to the consumers who actually run the rule

- **WHEN** a rule embeds a whole-program analysis engine rather than a syntactic
  pattern match
- **THEN** the pass measures its added run time against the population the gating
  result says will actually execute it, and records that measurement rather than
  asserting the cost is universal
