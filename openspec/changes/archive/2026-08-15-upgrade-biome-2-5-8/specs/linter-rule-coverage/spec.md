## MODIFIED Requirements

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

## ADDED Requirements

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
