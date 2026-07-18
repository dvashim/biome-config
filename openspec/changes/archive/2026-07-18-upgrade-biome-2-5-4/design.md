# Design: upgrade-biome-2-5-4

## Context

Biome 2.5.4 is the current npm `latest` dist-tag (`@biomejs/biome`, published
2026-07-15). The presets target 2.5.3 in every published `$schema` URL and in the
README. The `linter-rule-coverage` spec requires the presets to track the latest
stable Biome release; its "Newer release available" scenario prescribes exactly
this bump (six dist files, `biome.json`, `README.md`, and the `@biomejs/biome`
dependency), followed by re-deriving the rule set against the new version.

Current state of the working tree (branch `up`): a Dependabot pass has already
bumped `@biomejs/biome` `^2.5.3` → `^2.5.4` (installed and resolved in the
lockfile), alongside dev-only bumps to `@changesets/cli` (2.31.0 → 2.31.1) and
`validate-package-exports` (1.2.1 → 1.2.2). The `$schema` URLs, README, and a
changeset are the missing pieces.

The 2.5.4 upstream changelog is bug-fix / formatter-polish only — no new lint
rules, and no rules renamed, graduated out of nursery, or removed. The
rule-adjacent entries only fix or enhance rules the presets already cover
(`noLabelWithoutControl`, `noCommentText`, `useSortedClasses`).

## Goals / Non-Goals

**Goals:**

- Move the documented/pinned Biome target from 2.5.3 to 2.5.4 across all seven
  `$schema` URLs and the README, and commit the pending `@biomejs/biome` bump.
- Run and record the 2.5.4 rule audit; confirm the preset rule lists need no
  change and `-stable` stays in sync.
- Ship the change as a user-facing patch release via a changeset.

**Non-Goals:**

- No preset rule-list edits (`react-strict`, `react-balanced`) and therefore no
  `-stable` regeneration diff — the audit finds nothing in scope.
- No formatter / VCS / files / overrides / `engines` changes.
- No change to the *existing* `linter-rule-coverage` bump-mechanics or
  rule-reconciliation requirements, and no change to `dev-tooling-currency`. The
  only spec delta is one **added** requirement recording the release consequence of
  a tracking pass (Decision 5).
- No manual `package.json` `version` edit — Changesets owns the release bump.

## Decisions

1. **Target 2.5.4 (stable), and confirm it is genuinely latest.** `npm view
   @biomejs/biome dist-tags` reports `latest = 2.5.4`; the `beta` (`2.0.0-beta.6`)
   and `nightly` (`1.9.5-nightly.*`) tags are stale pre-release lines and are
   ignored — the presets track stable only. Re-verify at implementation time in
   case `latest` moves again.

2. **No rule-list changes — the audit is empty.** Biome 2.5.4 adds zero lint
   rules and renames/graduates/removes none (verified against the 2.5.4 release
   notes). `noLabelWithoutControl` and `noCommentText` fixes touch recommended /
   already-listed rules; the `useSortedClasses` change enhances an already-enabled
   nursery rule. So `react-strict` and `react-balanced` are untouched and
   `pnpm sync-stable` yields no diff. This is the concrete resolution of the
   "add new relevant rules" ask: there are none for 2.5.4. Alternative — a broader
   re-audit of *all* existing Biome rules against the presets — is rejected: the
   presets were fully reconciled against 2.5.3 in `add-missing-optin-rules` /
   `track-latest-changes-1-10-2`, and 2.5.4 introduces no rule surface to reconcile.

3. **Create a changeset (patch); do not skip it.** This bump edits published files
   (`dist/*.json` `$schema` and `README.md`), so it is user-facing and needs a
   changeset per CLAUDE.md — matching the PR #163 precedent that released the
   2.5.1 → 2.5.3 `$schema` bump. `patch` is correct: the schema URL points at a
   backward-compatible upstream patch and no preset behavior changes. Alternative —
   no changeset, as in `track-latest-changes-1-10-2` — is rejected: that pass
   changed nothing in the published package; this one does.

4. **Land the ride-along Dependabot dev bumps in the same commit.**
   `@changesets/cli` and `validate-package-exports` are already bumped in the
   working tree and are dev-only currency updates under `dev-tooling-currency`.
   Committing them together avoids leaving uncommitted drift. They do not affect
   the published `dist/` output, so they are not part of the changeset. Alternative
   — a separate PR — is rejected as needless churn.

5. **Spec delta: add the release-consequence requirement.** `linter-rule-coverage`
   specifies the *mechanics* of a version bump but not its *release consequence*.
   `track-latest-changes-1-10-2` (no changeset — nothing published changed) and this
   pass (patch changeset — `dist/*.json` `$schema` and `README.md` change) reached
   opposite release outcomes and each had to derive the rule from CLAUDE.md by hand.
   Capturing it as one added requirement makes the version-tracking behavior
   self-contained and testable, and pins the release surface to the *consumer-facing*
   files (`dist/*.json`, `README.md`) rather than dev-only edits like the
   `@biomejs/biome` devDependency range. The delta is **ADDED**, not MODIFIED, so no
   existing requirement text is touched. Alternative — leave it as CLAUDE.md prose
   with no spec delta — is rejected: two consecutive passes re-deriving the same
   distinction is the signal that a requirement is missing.

6. **Apply the edits mechanically, then let the existing checks gate.** The
   `$schema` value is line 2 of each JSON file (no key-order impact), so a plain
   string replace suffices; `biome check --write` reformats if needed and
   `pnpm check` verifies formatting, exports, `-stable` sync (expected: no drift),
   and types.

## Risks / Trade-offs

- **npm `latest` moves between proposal and apply** → Re-run `npm view
  @biomejs/biome dist-tags` at implementation. If a version > 2.5.4 exists, the
  same "Newer release available" scenario applies to that version instead; redo
  the rule audit for the wider delta before landing.
- **A patch release silently changed a covered rule's behavior** → Low: the 2.5.4
  notes are explicitly bug-fixes/formatter changes to already-covered rules.
  `pnpm check` on the repo's own dogfooded config would surface a regression.
- **`sync-stable` unexpectedly reports drift** → Would indicate a hidden rule
  change; treat as a signal to re-open the audit rather than force-regenerating.

## Migration Plan

Standard Changesets release flow: land the change on `up`, merge to `main`, and
the release workflow publishes the patch. Rollback = `git revert` of the commit;
consumers pinning the `latest` schema URL are unaffected, and those pinning
`2.5.4` can pin `2.5.3` again.

## Open Questions

- None blocking. The only live check — that 2.5.4 is still npm `latest` — is
  re-confirmed at implementation time (Decision 1).
