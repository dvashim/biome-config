## MODIFIED Requirements

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

## ADDED Requirements

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
