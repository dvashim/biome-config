## ADDED Requirements

### Requirement: Major dev-tool upgrades reconcile their integration points

When a tracking pass moves a dev tool across a **major** version boundary, the change SHALL also reconcile everything in the repo that is bound to the tool's previous major — the CI actions that drive it, the schema URLs pinned to its packages, and the documentation describing behavior the upgrade removes. A version range that resolves is not sufficient evidence of a working integration: an integration point whose contract the new major changed SHALL be verified against the new major's actual behavior, because a stale integration can fail silently rather than failing the build.

#### Scenario: CI action is bound to the tool's major

- **WHEN** a dev tool crosses a major version boundary and a GitHub Actions action in `.github/workflows/` is published in lockstep with that tool's majors
- **THEN** the workflow is moved to the action major that matches the installed tool major, pinned by commit SHA, with renamed or removed inputs migrated in the same change

#### Scenario: Integration point survives the upgrade unchanged

- **WHEN** an integration point is reviewed against a new major and its contract is unchanged
- **THEN** it is left as-is and the change records why it needed no edit, so the review is not silently mistaken for an omission

#### Scenario: Pinned schema URL trails the installed package

- **WHEN** a repo config file pins a `$schema` URL to an exact version of a package whose installed version the upgrade advanced
- **THEN** the pinned URL is updated to the installed version, and any config keys the new schema removed or renamed are migrated

#### Scenario: Documentation describes a failure mode the upgrade removed

- **WHEN** an upgrade drops a transitive dependency that project documentation names as the cause of a known failure
- **THEN** the documentation is corrected or removed, so it does not direct future debugging at a dependency the project no longer has
