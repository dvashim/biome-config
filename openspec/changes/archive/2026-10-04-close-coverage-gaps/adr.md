# ADR review

ADR review completed for this change.

## In-force ADRs reviewed

None. `docs/adr/` did not exist before this change, so no ADR was in force.

## ADRs created

- `docs/adr/0001-verify-rule-metadata-against-pinned-release.md`, from
  `design.md` Decision 2. It supersedes no ADR. It replaces a standing practice
  that `CLAUDE.md` and `linter-rule-coverage` recorded outside any ADR: `--check`
  skips while the installed binary and the pinned target differ.

Decisions reviewed and not recorded:

- **Decision 1** (one predicate for what the recommended set activates) brings the
  Coverage invariant into line with a rule the spec already states. It commits to
  nothing new.
- **Decision 3** (categories derived from `$defs.Rules`) applies the spec's
  existing "derive, don't list" principle to one more input. It is tactical.
- **Decision 4** (documentation and no changeset) is release content, not
  architecture.
