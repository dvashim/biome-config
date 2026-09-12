# Design: upgrade-biome-2-5-13

## Context

See `proposal.md` — Why. Three pieces of current state shape the order of work:

- **The installed binary is already at the target.** `pnpm exec biome --version`
  reports 2.5.13 while the presets pin 2.5.11, so `check:rule-metadata` is
  currently *skipping*, not passing. This is the standing spec's "installed binary
  is ahead of the pinned target" case: the presets are lagging, not current.
- **The usual first step is already done.** A normal pass bumps the dependency to
  move the binary before the metadata sweep will run. Here the dependency bump is
  already sitting uncommitted in the working tree, so the pass begins at the
  `$schema` edits instead.
- **`check:presets` passes today** (524 rules classified, 263 listed, 0
  unaccounted), so every failure this pass produces is one it caused.

## Goals / Non-Goals

**Goals:**

- Bring the pinned target, the rule-metadata snapshot, and the installed binary
  level at 2.5.13, so `check:rule-metadata` becomes live again.
- Reconcile the rule set against 2.5.13 and record the outcome of all four audit
  categories — added, graduated/renamed/removed, new options, behaviour changes —
  including the ones whose answer is "nothing moved".
- Keep every published count in `README.md` reconciled in the same change.

**Non-Goals:**

- The uncommitted **pnpm 11 → 12** major bump, the `@changesets/*` and
  `@types/node` bumps, and the regenerated OpenSpec assets. Those are
  `dev-tooling-currency` and need their own pass — a major crossing owes an
  integration-point review this change is not doing. Only `@biomejs/biome`'s
  range belongs here.
- Adding README highlight entries for all 11 new rules. `check:presets` verifies
  that every rule the README *names* exists in `react-strict`, not that every rule
  is named; the nursery highlights list is curated, not exhaustive.

## Decisions

### The new-rule audit comes from the schema key diff, not from `biome explain`

The rule set was derived by downloading the configuration schema for each release
in the gap and diffing the rule keys under the eight category definitions
(excluding the non-rule `preset` and `recommended` keys).

**The diff is taken per hop, not endpoint to endpoint.** This pass spans two
releases, and an endpoint-only diff cannot see a rule that appeared in 2.5.12 and
was renamed or removed by 2.5.13 — it would net out to nothing and be silently
dropped from the audit. Per hop:

| Hop | Added | Removed | Moved |
|---|---|---|---|
| 2.5.11 → 2.5.12 | 8 | 0 | 0 |
| 2.5.12 → 2.5.13 | 6 | 0 | 0 |
| union | **14** | **0** | **0** |

The union equals the endpoint diff, so nothing was transient this time — but that
is the *result* of the check, not a reason to skip it. The per-hop run also
reconciles the rule totals independently: 524 at 2.5.11 (matching the committed
snapshot), 532 at 2.5.12, 538 at 2.5.13.

**`biome explain`'s "Available from version" field is not a reliable substitute.**
It reports `noSvelteAtHtmlTags` as *available from 2.5.11*, yet that rule is
absent from the 2.5.11 schema and is announced in the **2.5.13** changelog. A pass
that used the version field to decide what is new would skip it. Nothing in the
repo reads that field today — the snapshot does not store it — but the trap is
worth recording, because the field is the obvious thing to reach for.

The changelog is also not the source of truth on its own: it is prose, and it
credits rules to the release that announced them. The schema diff is mechanical
and complete; the changelog is then read for the *behaviour* audit, which the
schema cannot see.

### The option audit compares resolved definition bodies, not just `$ref` names

"New options on already-listed rules" cannot be answered by comparing each rule's
schema fragment alone, because a rule points at a named options definition whose
*body* can change while the `$ref` stays identical. The audit therefore compared,
for every rule present in both versions, both the rule's own fragment and the
resolved body of the options definition it references. Result: **zero** rules
changed option shape. That empty answer is the audit outcome, not a skipped step.

### Order of operations is forced by the metadata sweep

`sync-rule-metadata` refuses to run while the `$schema` target and the installed
binary disagree. Since the binary is already at 2.5.13, the `$schema` edits must
land **before** `pnpm sync-rule-metadata`, and the snapshot must be regenerated
**before** `check:presets` can be trusted — it reads the snapshot, not the binary,
so until the snapshot moves it is still classifying against 2.5.11's 524 rules and
will not see the 14 new ones at all.

Consequence: a `check:presets` run between the `$schema` bump and the snapshot
regeneration reports the *pinned-target* invariant failing and nothing about
coverage. That is expected mid-pass and is not evidence the rule work is done.

### Rule entries are inserted, then ordered by the assist — not by hand

All 11 additions are bare severity strings with no `options` block, so under
`useSortedKeys` with `groupByNesting` they belong in the string-valued run at the
*front* of `nursery`, ahead of the object-valued entries at its tail. The pass
inserts them and then runs `biome check --write` to place them.

`pnpm run check` does **not** catch a mistake here: `check:format` runs `biome
format`, which never applies assists. `biome format --write` is likewise not
enough. This is the repo's standing trap and the reason ordering is delegated to
the assist rather than done by eye.

### Which requirement each balanced relaxation rests on

Worth stating so the reasoning is not mis-cited at review:

- `useLayeredStyles` → `off` and `useReactNamingConvention` → `info` and
  `useBetterDomTraversing` → `info` all rest on the **severity convention** for
  added rules — stylistic, high-noise, or broadly firing.
- They do **not** rest on the analysis-scope requirement added by the 2.5.11 pass.
  That one covers a rule that reports correct code because a definition it needs
  lives in *another file*. None of these three resolves anything across files:
  `useLayeredStyles` reports on what is in front of it. The distinction matters
  because the analysis-scope requirement mandates a relaxation, while the severity
  convention leaves it to judgement.
- `useReactNamingConvention` additionally exercises the **framework-rules**
  requirement: it belongs to the `react` domain, gated on `react@>=16`, and
  explicit listing was confirmed to defeat that gate. The confirmation is required
  by that requirement rather than optional, because `useReactCompiler` is a known
  counter-example that still self-gates.

### The three excluded rules get no ledger entries

`noSvelteAtHtmlTags`, `noVueDeprecatedScopedSlots`, and `useVueBaseImport` each
publish a framework-only domain (`svelte`, `vue`, `vue`), so the metadata places
them without help. `audit/rule-exclusions.json` rejects an entry for a rule
derivation already classifies, so adding one would fail the check — the absence of
entries is the correct outcome, and the pass verifies "0 unaccounted" rather than
asserting it.

### CLAUDE.md's two stale counts are fixed here

`CLAUDE.md` says `82 of them nursery` (actual 83) and `the total (18)` (actual
19). Both predate this pass — the 2.5.11 pass moved the neighbouring `19`s but
missed these two. Nothing checks this file, which is how they survived. This pass
rewrites all four of those sentences anyway, so it corrects them rather than
carrying a known-wrong number forward into a new known-wrong number.

## Risks / Trade-offs

- **11 new nursery rules is the largest rule-set movement in the presets' history,
  and consumers on `react-strict` get all of them at `warn` at once.** → They are
  nursery, so they reach only `react-strict` and `react-balanced`, never the
  `-stable` variants that exist for consumers who do not want experimental rules.
  The changeset is `minor` and names them, and the three highest-volume rules are
  relaxed in `balanced`.

- **`useLayeredStyles` at `warn` in `react-strict` will be loud** — one diagnostic
  per style rule in any project not using `@layer`. → That is the intended
  contract of `react-strict`, which is opt-in maximalism; `react-balanced` turns
  it off, and `react-balanced-stable`/`react-strict-stable` never see it. Recorded
  in the README relaxation table so the choice is visible before adoption.

- **Type-inference improvements will surface new diagnostics on unchanged
  consumer code**, from listed rules like `noFloatingPromises` and
  `noMisusedPromises`, with no rule-list movement to signal it. → Called out in the
  changeset body rather than only in the rule-list summary, since a consumer
  reading "11 rules added" would not otherwise expect their existing code to start
  reporting.

- **A README count can be missed silently if a matcher's prose is reworded.** →
  `check:presets` fails when a matcher finds nothing, so a retired phrase fails
  rather than passing. The tasks name each matcher's exact phrase so the edits
  keep them anchored.

- **The `noBunModules` finding is a judgement call that keeps a rule at `warn`
  knowing it reports correct code for some consumers.** → Bun-runtime projects are
  not this package's stated audience and can turn one nursery rule off; the
  finding and the reasoning are recorded in the proposal and generalized into a
  requirement so the next such rule is tested rather than assumed.

## Migration Plan

No consumer migration. Consumers pick up the change by upgrading the package;
those who do not want the new rules pin the previous minor or extend a `-stable`
preset, both of which are unaffected in rule content.

Rollback is a package revert — the presets are data files with no build step.
