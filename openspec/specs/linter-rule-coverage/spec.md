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

Because the presets do not declare a `domains` key, Next.js and React Native rules SHALL be activated by listing each rule individually in `linter.rules`, not via Biome domain auto-detection. The presets SHALL acknowledge that explicitly listed framework rules can emit diagnostics outside their framework (e.g. a rule that flags every `<img>`), and `react-balanced` SHALL relax such broadly-firing framework rules.

#### Scenario: React Native rule with no Biome domain is enabled

- **WHEN** a React Native rule has no corresponding Biome domain
- **THEN** it is enabled by an explicit `linter.rules` entry rather than a domain setting

#### Scenario: Broadly-firing framework rule is relaxed in balanced

- **WHEN** a listed framework rule fires on patterns common outside its framework (e.g. `noImgElement` on any `<img>`)
- **THEN** `react-balanced` lists it at a relaxed severity (`info` or `off`) while `react-strict` keeps it at `warn`

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

The presets SHALL target the latest stable `@biomejs/biome` release. Reconciliation SHALL verify the current version against the npm registry; when it is already latest, the `$schema` URLs and `@biomejs/biome` dependency are left unchanged and only the rule lists are reconciled.

#### Scenario: Already on latest

- **WHEN** the installed Biome version equals the npm `latest` dist-tag
- **THEN** no `$schema` or dependency bump is made and the rule reconciliation proceeds against that version

#### Scenario: Newer release available

- **WHEN** a newer stable Biome release exists
- **THEN** the `$schema` URLs (six dist files, `biome.json`, `README.md`) and the `@biomejs/biome` dependency are bumped, and the rule set is re-derived against the new version

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

