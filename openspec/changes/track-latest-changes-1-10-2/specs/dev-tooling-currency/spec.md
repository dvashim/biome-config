# dev-tooling-currency delta

## ADDED Requirements

### Requirement: Dev toolchain tracks latest stable releases

The repo's dev toolchain — the devDependencies other than `@biomejs/biome` (whose version tracking is owned by the `linter-rule-coverage` capability), the pinned `packageManager` (pnpm), and the OpenSpec CLI used for this workflow — SHALL track the latest stable releases. A tracking pass SHALL compare each installed version against the npm `latest` dist-tag and record the result.

#### Scenario: Tool already at latest

- **WHEN** a tracking pass finds an installed tool version equal to its npm `latest` dist-tag
- **THEN** the tool is left unchanged and the pass records that it is current

#### Scenario: Tool behind latest

- **WHEN** a tracking pass finds an installed tool version older than its npm `latest` dist-tag
- **THEN** the tool is updated to `latest` and `pnpm check` is re-run to confirm the repo's checks still pass

### Requirement: OpenSpec-generated assets are regenerated, never hand-edited

The OpenSpec-managed assets (`.claude/commands/opsx/*.md` and `.claude/skills/openspec-*/SKILL.md`) SHALL be produced only by the OpenSpec CLI's regeneration command. After an OpenSpec CLI update, the assets SHALL be regenerated so each skill's `generatedBy` metadata matches the installed CLI version, and the regenerated files SHALL be committed with the update rather than left as uncommitted working-tree state.

#### Scenario: CLI updated and assets regenerated

- **WHEN** the OpenSpec CLI is updated to a new version
- **THEN** the regeneration command is run and the resulting `.claude/` asset changes are committed in the same change

#### Scenario: generatedBy drift signals a pending regeneration

- **WHEN** a skill's `generatedBy` metadata differs from the installed OpenSpec CLI version
- **THEN** the tracking pass treats the assets as stale and regenerates them
