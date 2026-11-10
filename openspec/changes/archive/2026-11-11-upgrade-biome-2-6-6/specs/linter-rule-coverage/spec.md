# Spec Delta

## MODIFIED Requirements

### Requirement: In-scope non-recommended rules are explicitly enabled

The `react-strict` and `react-balanced` presets SHALL explicitly enable every Biome linter rule that both (a) targets `js`, `ts`, `css`, `scss`, `html`, `json`, or `jsonc`, or belongs to the React, Next.js, React Native, `test`, or `project` domains, and (b) is not part of Biome's default `recommended` set of stable rules. Nursery rules are treated as in scope because `recommended: true` does not activate them.

Clause (a) is a **disjunction** and SHALL be evaluated as one: a rule qualifies
through its target language *or* through its domains. The domains named there are
not an exhaustive list of the domains the presets may carry — Biome declares
others, including `types`, `playwright`, `drizzle`, `tailwind`, `tanstackQuery`,
and `turborepo` — so a rule belonging only to an unnamed domain is in scope
whenever its target language qualifies, and SHALL NOT be treated as out of scope
on the strength of its domain alone.

SCSS is named in clause (a) in its own right. Biome tags SCSS examples separately
from CSS, so naming CSS alone would leave a rule documented only in SCSS neither in
scope nor excluded. Biome lints and formats `.scss` files for every consumer of the
presets, so such a rule SHALL be classified like a CSS rule.

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

#### Scenario: Rule documented only in SCSS is in scope

- **WHEN** a non-recommended rule publishes examples only in SCSS and declares no
  domain
- **THEN** both presets list it with an explicit severity, and neither the
  coverage check nor the listed-rule scope check reports it

## ADDED Requirements

### Requirement: Settings outside the rule options are audited on upgrade

A version-tracking pass SHALL audit every configuration setting the target Biome
release adds outside the rule options, and every such setting whose default it
changes — top-level sections, parser, formatter, and assist settings, and new
domains — and SHALL record the outcome for each. A pass that finds none SHALL
record that the audit ran.

#### Scenario: Release adds a setting

- **WHEN** the target release's configuration schema declares a setting outside
  the rule options that the previous target did not
- **THEN** the pass records the setting, its default, and whether the presets set
  it

#### Scenario: Release changes a setting's default

- **WHEN** the target release changes the default of a setting outside the rule
  options
- **THEN** the pass records the change, and records whether any preset sets that
  setting

#### Scenario: Release adds no setting

- **WHEN** the target release adds no setting outside the rule options and changes
  no default
- **THEN** the pass records that the audit ran and found none, so the absence is
  distinguishable from the audit having been skipped

### Requirement: The presets keep Biome's default for a setting unless that default damages files

The presets SHALL leave a setting outside the rule options at Biome's default
unless that default damages files the presets have Biome process under the
workflow the README documents. They SHALL NOT set one to restate its default or to
tune output to taste. A setting adopted to protect files SHALL be set identically
in all six presets and SHALL be named in the README's Defaults section.

#### Scenario: New setting's default is harmless

- **WHEN** a release adds a setting whose default damages no file the presets have
  Biome process
- **THEN** no preset sets it, and the presets inherit Biome's default, including
  any later change to it

#### Scenario: New setting's default damages files

- **WHEN** a release adds a setting whose default damages files under the README's
  workflow — for example `biome check --write` turning Markdown front matter into
  a heading
- **THEN** all six presets set the protective value in the block they share, and
  the README's Defaults section names it

#### Scenario: Biome's default comes to match a protective setting

- **WHEN** a release changes a setting's default to the value the presets set to
  protect files
- **THEN** the setting is removed from all six presets and from the README's
  Defaults section

#### Scenario: Setting preferred for style is not adopted

- **WHEN** a setting's default is harmless but differs from a maintainer's taste
- **THEN** no preset sets it
