# ADR review

ADR review completed for this change.

## In-force ADRs reviewed

- `docs/adr/0001-verify-rule-metadata-against-pinned-release.md` — in force (no later
  ADR supersedes it; before this change it was the only ADR, so the highest number in
  use was 0001). It binds the regeneration: the snapshot is swept and serialized by a
  binary of the pinned release, fetched until the pins move and the installed 2.6.2
  afterwards. Serializing loads the repository's own configuration, so the setting
  2.6 rejects leaves the presets first (`design.md` — Prior decisions, decision 15).
  This change complies and departs from nothing.

## ADRs created

- `docs/adr/0002-keep-biome-defaults-for-new-settings.md` — new; supersedes nothing.
  It records the test behind `design.md` decision 9: settings Biome adds outside the
  rule options keep Biome's defaults unless a default damages files. Later passes
  will meet more such settings — 2.6 added three sections — and the standing
  requirement covers rule options only.

Each other decision in `design.md` was checked against the three criteria:

- **Decisions 1, 12, 15, 17, and 18** (the audits, the counts, the order of work, the
  migration preview, the dependency range) carry out the standing
  `linter-rule-coverage` requirements for one release. They commit to nothing beyond
  it.
- **Decisions 2, 3, 4, 5, and 7** (promotions, the rename, scope, levels, the
  `noEmptySource` ledger entry) apply the standing requirements and the ledger to
  this release's rules. They are tactical and bind no later change.
- **Decision 6** (Markdown and YAML leave the scope; examples are read by their
  opening fence) is durable. Scope policy is recorded as a requirement, so it goes
  into the `linter-rule-coverage` delta spec; an ADR would duplicate it.
- **Decision 8** (`gritMetavariables`) is forced by 2.6. **Decision 10**'s outcomes
  are this release's, and its one adoption is ADR 0002.
- **Decision 11** (the repository's own checks leave Markdown and the lockfile alone)
  is a tooling choice for this repository, reversible in one line and recorded in
  `CLAUDE.md`. It constrains neither the presets nor later passes' rule work.
- **Decisions 13, 14, 16, and 19** (README, `CLAUDE.md`, the behaviour audit, the
  changeset) are documentation and release content.
- **A fix-applicability override for `noTailwindLegacyUtilities`** would qualify,
  because it would add a configuration surface the presets have never used. This
  change deliberately does not make that decision (`design.md` — Non-Goals, Risks),
  so there is nothing to record. The same holds, again, for a peer dependency on
  `@biomejs/biome`.
