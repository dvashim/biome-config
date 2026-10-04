# ADR review

ADR review completed for this change.

## In-force ADRs reviewed

- `docs/adr/0001-verify-rule-metadata-against-pinned-release.md` — in force (no later
  ADR supersedes it; it is the only ADR, so the highest number in use is 0001). It
  binds the regeneration: the snapshot is swept and verified by a binary of the pinned
  release, fetched until the pins move and the installed 2.5.15 afterwards
  (`design.md` — Prior decisions, decision 10). This change complies and departs from
  nothing.

## ADRs created

No durable architectural decisions introduced; no ADRs created.

Each decision in `design.md` was checked against the three criteria:

- **Decisions 1, 2, 7, 10, 12, and 13** (the audits, the counts, the order of work,
  the migration preview, the dependency range) carry out the standing
  `linter-rule-coverage` requirements for one release. They commit to nothing beyond
  it.
- **Decisions 3 and 4** (each added rule's level, and the `noTailwindArbitraryValue`
  option outcome) apply the severity convention and the new-options requirement to
  this release's rules. They are tactical and bind no later change.
- **Decisions 5, 6, 8, 9, 11, and 14** (the `useReactCompiler` and domain findings,
  the README and `CLAUDE.md` wording, the behaviour audit, the changeset) are
  observations, documentation, and release content.
- **Rewording counts so they carry no number** (decision 9) repeats the remedy the
  2.5.14 pass applied. It is a documentation habit, not an architectural boundary.
- **The peer dependency on `@biomejs/biome`** would qualify, but this change
  deliberately does not make that decision (`design.md` — Non-Goals), so there is
  nothing to record.
