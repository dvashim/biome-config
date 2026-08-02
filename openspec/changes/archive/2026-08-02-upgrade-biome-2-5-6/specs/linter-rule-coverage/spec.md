## ADDED Requirements

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

## MODIFIED Requirements

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
