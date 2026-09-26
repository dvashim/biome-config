# ADR review

ADR review completed for this change.

## In-force ADRs reviewed

None — `docs/adr/` does not exist yet.

## ADRs created

No durable architectural decisions introduced; no ADRs created.

Each decision in `design.md` was checked against the three criteria:

- **Decisions 1, 2, 5, 8, and 10** (the audits, the counts, the order of work, the
  migration preview) carry out the standing `linter-rule-coverage` requirements for
  one release; they commit to nothing beyond it.
- **Decisions 3 and 4** (each added rule's level, and `requireExplicitCase`) apply
  the severity convention and the new-options requirement to this release's rules.
  They are tactical and bind no later change.
- **Decisions 6, 7, 9, and 11** (the README sentence, the `CLAUDE.md` figure, the
  behaviour audit, the changeset) are documentation and release content.
- **The peer dependency on `@biomejs/biome`** would qualify — a packaging contract
  every later pass would have to maintain — but this change deliberately does not
  make that decision (`design.md` — Non-Goals), so there is nothing to record.
