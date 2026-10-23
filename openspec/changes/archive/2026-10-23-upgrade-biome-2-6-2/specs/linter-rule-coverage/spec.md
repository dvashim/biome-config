# Spec Delta

## MODIFIED Requirements

### Requirement: Out-of-scope rules are excluded

The presets SHALL NOT enumerate GraphQL, Markdown, or YAML language rules, nor
rules whose only applicable domain is `vue`, `solid`, `qwik`, `svelte`, or `astro`.

Both exclusions SHALL be derived from the target release's own rule metadata
rather than from a maintained list. A rule's domains are published directly, so
the framework-domain exclusion SHALL follow from them and SHALL extend
automatically to any framework-only domain a later Biome release introduces. A
rule's target language is published only in its documented examples, each of
which names the language it is written in; the language exclusion SHALL be
derived from those, treating a rule as excluded by its language when every example
it publishes is written in GraphQL, Markdown, or YAML.

An example SHALL be read by the fence that opens it. A fence of four or more
backticks can wrap shorter fences — a Markdown rule's example does whenever it
shows a fenced code block — and the wrapped fences are the example's content, not
examples of their own: the language the example publishes is the one its opening
fence names.

Derivation SHALL NOT be assumed total. A rule that publishes no example in any
language — a configuration-required rule whose only documented block is its own
options sample — cannot be classified this way, and neither can a rule whose
examples show only part of what it checks, such as one documented solely in an
excluded language that also reports in a language the presets cover. Any rule the
metadata cannot place SHALL be recorded in a ledger naming the rule, the reason,
and a **direction** — whether the rule is in scope or out of it. The direction is
required because a rule the metadata cannot classify may be correctly *listed*
rather than correctly absent, and a ledger that can only record exclusions cannot
say so. The ledger SHALL be the only sanctioned way to account for such a rule in
either direction, so that an unrecorded one is reported as awaiting
classification rather than being silently absent or silently present, and it
SHALL hold no entry for a rule that derivation already classifies.

Excluding a framework's rules SHALL NOT be read as excluding its files, and
excluding a language's rules SHALL NOT be read as excluding files written in it.
The presets lint every file the installed Biome can parse, so a consumer with
files of an excluded framework or language still receives the parser and
formatter behaviour Biome applies to them, and the reports of any listed rule that
also covers that language. A pass SHALL therefore disclose upstream work on an
excluded framework or language when it reaches those files, rather than treating
the exclusion from the rule lists as a reason to omit it.

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

#### Scenario: Markdown or YAML rule is excluded by its published examples

- **WHEN** every example a rule publishes is written in Markdown or YAML
- **THEN** it is absent from both presets, excluded on the strength of those
  examples without an entry being added to the exclusion ledger

#### Scenario: Example wrapped in a longer fence is read by its opening fence

- **WHEN** a rule publishes an example opened by a fence of four or more
  backticks that contains shorter fences, such as a Markdown document showing a
  fenced JavaScript block
- **THEN** the language recorded for that example is the one the opening fence
  names, and the fences inside it add no language of their own

#### Scenario: Listed rule documented only in an excluded language stays listed

- **WHEN** a rule the presets list publishes examples only in an excluded
  language, while it also reports in a language the presets cover
- **THEN** the ledger records it as in scope with that reason, and the rule stays
  listed rather than being reported as a rule that does not belong

#### Scenario: Excluded language's files still reach consumers

- **WHEN** a Biome release starts formatting or linting files of a language whose
  rules the presets exclude
- **THEN** the pass records that the change reaches every consumer with such
  files, and the release notes the change publishes say so
