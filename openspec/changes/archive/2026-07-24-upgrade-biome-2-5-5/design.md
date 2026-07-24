# Design: upgrade-biome-2-5-5

## Context

Biome 2.5.5 is the current npm `latest` dist-tag (`@biomejs/biome`, published
2026-07-21). The presets target 2.5.4 in every published `$schema` URL, in
`biome.json`, in the README, and in the `@biomejs/biome` devDependency range.
`linter-rule-coverage` requires the presets to track the latest stable Biome
release ("Newer release available") and to explicitly enable every in-scope
non-recommended rule — nursery rules included, since `recommended: true` never
activates them.

2.5.5 is a patch release whose rule surface changed in exactly one place. A
rule-name diff of the two configuration schemas (the installed
`node_modules/@biomejs/biome/configuration_schema.json` for 2.5.4 against
`https://biomejs.dev/schemas/2.5.5/schema.json`) reports **517 → 518** rules:
`nursery.noNegationInEqualityCheck` added, nothing removed, nothing moved between
categories. The rest of the release is bug fixes, perf work, and CSS/HTML/YAML
formatter changes affecting rules the presets already list.

Working tree: branch `up`, clean, no pending Dependabot bumps to ride along.

## Goals / Non-Goals

**Goals:**

- Move the documented/pinned Biome target from 2.5.4 to 2.5.5 across the seven
  `$schema` URLs, the README, and the `@biomejs/biome` devDependency.
- Add the one in-scope rule 2.5.5 introduced — `noNegationInEqualityCheck` — to
  `react-strict` and `react-balanced`, and regenerate the `-stable` variants.
- Keep the README's rule inventory (nursery count, highlights) truthful.
- Ship as a user-facing `minor` release via a changeset.

**Non-Goals:**

- No re-audit of the pre-existing rule set. The presets were fully reconciled
  against 2.5.x in `add-missing-optin-rules` / `track-latest-changes-1-10-2` /
  `upgrade-biome-2-5-4`; 2.5.5 introduces exactly one new rule to reconcile.
- No formatter / VCS / files / overrides / `engines` changes.
- No non-Biome devDependency bumps — those belong to `dev-tooling-currency` and
  the working tree carries none.
- No manual `package.json` `version` edit — Changesets owns the release bump.

## Decisions

1. **Target 2.5.5 (stable) and confirm it is genuinely latest.** `npm view
   @biomejs/biome dist-tags` reports `latest = 2.5.5`; `beta` (`2.0.0-beta.6`) and
   `nightly` (`1.9.5-nightly.*`) are stale pre-release lines the presets do not
   track. Re-verify at implementation time in case `latest` moves again.

2. **Audit by schema diff, not by reading release notes alone.** The rule set is
   derived by diffing rule-name keys per category between the 2.5.4 and 2.5.5
   configuration schemas, then cross-reading the release notes for intent. Release
   notes reliably announce *added* rules but not always renames, graduations, or
   removals; the schema diff catches all four mechanically. Result: one addition
   (`nursery.noNegationInEqualityCheck`), zero renames, zero graduations, zero
   removals — so the "graduated / renamed / removed" reconciliation requirements
   have nothing to act on this pass.

3. **`noNegationInEqualityCheck` at `warn` in both strict and balanced.** House
   convention puts added rules at `warn` in `react-strict`; `react-balanced`
   relaxes only purely stylistic, high-noise, or broadly-firing framework rules.
   This one is none of those — it fires on a precedence bug (`!foo === bar`
   evaluating as `(!foo) === bar`, almost always meant as `foo !== bar`), a narrow
   pattern with essentially no legitimate use. Alternatives rejected: `error` in
   either preset (the presets reserve `error` for a handful of rules such as
   `noMisusedPromises` and `noJsxPropsBind`, and a nursery rule is not a candidate
   for that tier); `info`/`off` in balanced (no noise or false-positive argument to
   justify relaxing a bug-catcher). The rule ships an *unsafe* fix, which does not
   affect severity choice — the presets never apply unsafe fixes automatically.

4. **Insert the rule in sorted position within `nursery`.** Both presets' nursery
   blocks are alphabetically sorted with string-valued entries first (the
   `useSortedKeys` assist runs with `groupByNesting`). The new entry is a plain
   `"warn"` string, so it goes between `noMisusedPromises` and
   `noPlaywrightElementHandle` in both files. `biome check --write` is the
   authority; `biome format --write` alone would not re-sort.

5. **Let `sync-stable` own the `-stable` files.** `scripts/sync-stable.ts` derives
   each `-stable` file wholesale from its parent (parse, delete
   `linter.rules.nursery`, reformat), so both the `$schema` bump and the nursery
   addition propagate automatically: the `-stable` variants end up with a bumped
   `$schema` and an unchanged 182-rule list. Editing the `-stable` `$schema` by
   hand is harmless (the regeneration converges to the same bytes) but
   unnecessary — run `pnpm sync-stable` and let `check:sync-stable` gate the result.

6. **Release as `minor`.** The pass changes preset behavior consumers can observe:
   `react-strict` / `react-balanced` users get a new diagnostic. This matches the
   1.7.0 / 1.8.0 / 1.9.0 / 1.10.0 precedent (Biome bump + new nursery rules →
   minor) and is distinct from the schema-only bumps released as patches (1.9.1,
   1.10.2, 1.10.3). Alternative — `patch`, as in the immediately preceding
   `upgrade-biome-2-5-4` pass — is rejected: that pass changed no rule list.

7. **Spec delta: make the `minor` case explicit and pin README accuracy.** The
   existing release-consequence requirement states the `patch` and no-changeset
   cases but stops short of the rule-adding case, so this pass had to derive
   `minor` from CHANGELOG precedent — the same "derived by hand twice" signal that
   produced the requirement in the first place. It is **MODIFIED** (full text
   carried over, one sentence and one scenario added) rather than ADDED, because
   the new case belongs inside the same rule. Separately, the README publishes a
   per-category rule count (`nursery (71 rules)`) and a highlights list that a rule
   addition silently invalidates; every past rule-adding release updated them by
   habit, so an **ADDED** requirement records the obligation. Alternative — leave
   both as prose in CLAUDE.md — is rejected for the release rule (already
   re-derived twice) and would leave the count with no owning check.

8. **Apply mechanically, then let `pnpm check` gate.** `$schema` is line 2 of each
   JSON file (no key-order impact), and the rule insert is one line per preset.
   `biome check --write` applies formatting and key order; `pnpm check` then
   verifies formatting, packaging (`publint`), `-stable` sync, and types.

## Risks / Trade-offs

- **npm `latest` moves between proposal and apply** → Re-run `npm view
  @biomejs/biome dist-tags` at implementation. If a version above 2.5.5 exists,
  rescope to it and redo the schema diff for the wider delta before landing.
- **2.5.5 formatter changes reformat repo files** → 2.5.5 changes CSS, HTML, and
  YAML formatting; this repo formats JSON, Markdown, and one `.ts` script, so no
  diff is expected. Verify empirically: install 2.5.5, run `pnpm check`, and if
  `biome format` does report a diff, commit the reformatted output with the bump
  rather than pinning back.
- **The new rule fires noisily in consumer code** → Low: the trigger is a negated
  operand on the left of `===`/`!==`. It is nursery-only, so `-stable`,
  `recommended`, and `react-recommended` consumers are unaffected, and any consumer
  can override it to `off` locally.
- **`sync-stable` reports drift beyond the `$schema` line** → Would mean a rule
  moved out of nursery unnoticed; treat as a signal to re-open the audit rather
  than committing the regenerated files blindly.

## Migration Plan

Standard Changesets flow: land the change on `up`, open a PR to `main`, and the
release workflow publishes the minor (1.10.3 → 1.11.0). Rollback = `git revert`
of the commit; consumers who want the old behavior can pin the previous package
version or set `noNegationInEqualityCheck: "off"` in their own `biome.json`,
which merges over the preset.

## Open Questions

- None blocking. The one live check — that 2.5.5 is still npm `latest` — is
  re-confirmed at implementation time (Decision 1).
