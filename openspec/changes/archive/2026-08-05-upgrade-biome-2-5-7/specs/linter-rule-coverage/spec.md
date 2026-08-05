## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Framework rules are enabled by explicit listing

Because the presets do not declare a `domains` key, rules belonging to any
dependency-gated Biome domain — React Native, Next.js, Playwright, Drizzle,
Tailwind, and any domain Biome adds later — SHALL be activated by listing each
rule individually in `linter.rules`, not via Biome domain auto-detection. The
presets SHALL acknowledge that an explicitly listed domain rule fires for every
consumer, including those that do not use the framework the domain gates on, and
`react-balanced` SHALL relax such a rule when it is broadly firing — whether the
noise comes from outside the framework (a rule that flags every `<img>`) or from
inside it, by flagging a practice the framework itself sanctions.

#### Scenario: React Native rule with no Biome domain is enabled

- **WHEN** a React Native rule has no corresponding Biome domain
- **THEN** it is enabled by an explicit `linter.rules` entry rather than a domain setting

#### Scenario: Dependency-gated domain rule is enabled unconditionally

- **WHEN** a rule belongs to a domain Biome activates only on detecting a
  dependency (e.g. `tailwind` on `tailwindcss`)
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
