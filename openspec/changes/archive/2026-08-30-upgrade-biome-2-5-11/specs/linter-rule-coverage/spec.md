## ADDED Requirements

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
