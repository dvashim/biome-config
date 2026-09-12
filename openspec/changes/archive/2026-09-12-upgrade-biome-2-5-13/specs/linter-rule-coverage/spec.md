## ADDED Requirements

### Requirement: A rule's dependency-based suppression is verified across its full trigger surface

A rule MAY suppress its own diagnostics on the strength of the consumer's
declared dependencies while belonging to **no** Biome domain. Such a rule is not
reached by the domain reasoning the presets apply to dependency-gated domains: it
carries no domain to gate on, so listing it explicitly neither defeats nor
preserves a gate, and whether it reports for a given consumer is decided by that
consumer's `package.json` alone.

When a pass levels a rule that behaves this way, the suppression SHALL be
established empirically against **every trigger form the rule documents**, not
against one representative form. A suppression that covers one form and not
another changes which consumers actually receive the diagnostics, and testing a
single form can report a gate as total when it is partial. The result SHALL be
recorded with the severity decision, because a partial suppression is invisible
in the rule's category, its domains, and its description alike.

The severity decision SHALL be made on the **unsuppressed** surface — the trigger
forms that still report once the consumer has declared the dependencies the rule
recognises — rather than on the assumption that declaring them silences the rule.

#### Scenario: Domainless rule suppresses itself from declared dependencies

- **WHEN** a rule belongs to no domain yet stops reporting once the consumer
  declares a matching dependency
- **THEN** the pass records that its audience is decided by the consumer's
  declared dependencies, rather than treating the rule as reporting for every
  consumer because it carries no domain

#### Scenario: Partial suppression is found by testing every documented form

- **WHEN** such a rule documents more than one trigger form — for example a bare
  module specifier and a namespaced submodule specifier — and the declared
  dependency suppresses only some of them
- **THEN** the pass tests each documented form, records which remain reported,
  and does not conclude from one suppressed form that the rule is silenced

#### Scenario: Severity is decided on what still reports

- **WHEN** a rule's suppression leaves some documented trigger forms still
  reporting for consumers who have declared the dependency
- **THEN** the balanced relaxation is judged against those remaining forms, and a
  decision to keep the rule at `warn` records why the surface that still reports
  is acceptable for the presets' audience

### Requirement: A pass spanning several releases diffs each release in turn

When a version-tracking pass advances the pinned target across **more than one**
Biome release, the rule-set audit SHALL diff each release against its immediate
predecessor, rather than diffing only the release the presets leave against the
release they arrive at. The union of the per-hop results SHALL be the audit.

An endpoint-to-endpoint diff is not sufficient evidence. A rule that is added in
an intermediate release and then renamed or removed before the target nets out to
nothing across the endpoints, so it is absent from such a diff entirely — neither
reported as added nor reported as removed — and a pass reading only the endpoints
cannot tell that case apart from a release that introduced nothing. The same
applies to a rule that changes category in an intermediate release and changes
back.

Finding that no rule was transient SHALL be recorded as the outcome of the
per-hop check, and SHALL NOT be treated as a reason to omit the check on a later
pass. Multi-release gaps are the normal consequence of a skipped pass or of an
automated dependency bump moving the installed binary ahead of the presets.

#### Scenario: Two releases are audited as two hops

- **WHEN** a pass advances the pinned target across two Biome releases
- **THEN** the audit diffs the first release against the pinned target and the
  second against the first, and reports the union of both results

#### Scenario: Transient rule is caught by the per-hop diff

- **WHEN** a rule is added in an intermediate release and removed or renamed
  before the target release
- **THEN** the per-hop diff reports it in the hop that added it and in the hop
  that removed it, so the pass accounts for it deliberately rather than never
  seeing it

#### Scenario: No transient rule is itself the recorded result

- **WHEN** the union of the per-hop diffs equals the endpoint-to-endpoint diff
- **THEN** the pass records that agreement as the check's outcome, rather than
  citing it as grounds for diffing only the endpoints next time
