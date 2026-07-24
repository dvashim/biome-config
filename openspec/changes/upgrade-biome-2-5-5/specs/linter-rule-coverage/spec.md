## ADDED Requirements

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

## MODIFIED Requirements

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
