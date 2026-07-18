## ADDED Requirements

### Requirement: Version-tracking passes release according to their published impact

A Biome version-tracking pass SHALL create a Changesets release when it edits the
consumer-facing published surface — any `dist/*.json` preset or `README.md` — and
SHALL NOT create a changeset when it edits only dev dependencies (including the
`@biomejs/biome` devDependency range), the root `biome.json`, planning artifacts,
or OpenSpec-generated tooling assets while leaving every `dist/*.json` preset and
`README.md` unchanged. When such a release only advances the pinned `$schema`
target to a newer stable Biome version and makes no preset rule-list change, it
SHALL be a `patch`.

#### Scenario: Newer-release bump ships as a patch

- **WHEN** a pass advances the `$schema` URLs in the six `dist/*.json` presets
  (together with `biome.json` and `README.md`) to a newer stable Biome version and
  makes no change to the preset rule lists
- **THEN** a `patch` changeset is created that names the new target version

#### Scenario: Dev-only or no-op pass creates no changeset

- **WHEN** a pass leaves every `dist/*.json` preset and `README.md` unchanged — for
  example it confirms the presets already target the npm `latest` Biome release, or
  it only bumps dev dependencies or regenerates tooling assets
- **THEN** no changeset is created and no release is published
