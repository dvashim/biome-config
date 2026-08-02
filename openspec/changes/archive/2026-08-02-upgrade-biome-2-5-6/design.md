## Context

See `proposal.md` — Why. The design-relevant constraints:

- `dist/` is **source**, not build output. There is no build step and no test
  suite, so correctness rests on `pnpm check` (`format`, `publint`,
  `sync-stable --check`, `types`) plus manual review.
- The two `-stable` presets are byte-exact derivations produced by
  `scripts/sync-stable.ts`; the blank lines between top-level blocks are
  load-bearing for its comparison, so they are regenerated, never hand-edited.
- Key order in `dist/*.json` is enforced by the `useSortedKeys` assist with
  `groupByNesting`, which sorts string-valued entries ahead of object-valued ones
  within a category. `pnpm check` runs `biome format` only and does **not**
  verify key order; `biome check --write` is what applies the sort.
- Measured starting state: `react-strict` and `react-balanced` each list 254
  rules (nursery 72), both `-stable` variants list 182, and all 72 nursery
  entries are **identical** across strict and balanced — every one of the 15
  balanced relaxations lives in another category.

## Goals / Non-Goals

**Goals:**

- Land the 2.5.5 → 2.5.6 target bump and the single rule addition as one
  reviewable change, with the audit evidence recorded rather than implied.
- Keep the `-stable` variants mechanically derived and drift-free.
- Fix the version-tracking requirement that misfires on the split state this pass
  encountered, so the next Dependabot-driven bump reconciles cleanly.

**Non-Goals:**

- Re-auditing rules that predate 2.5.6. The scope is the 2.5.5 → 2.5.6 delta; the
  standing coverage requirement was satisfied by the prior pass.
- Choosing a restriction policy for `noJsRestrictedProperties`. Naming specific
  banned object/property pairs is a consumer decision (see Decision 2).
- Touching `dev-tooling-currency` concerns (non-Biome devDependencies, pnpm, the
  OpenSpec CLI).

## Decisions

### 1. Insert the rule as a bare string at its alphabetical position

`"noJsRestrictedProperties": "warn"` goes between `noInlineStyles` and
`noJsxLeakedDollar` in the `nursery` block of both presets. Because all 72
existing nursery entries are string-valued, the `groupByNesting` string-before-object
ordering rule has no effect here and the insert is plain alphabetical — unlike the
`style` category, where object-valued entries must stay last.

*Alternative considered:* appending and letting `biome check --write` sort it.
Rejected as the primary approach — it works, but placing it correctly keeps the
diff to one line and makes the sort a verification step rather than a repair step.

### 2. Ship it with no `options` block

The rule is inert until `entries` is supplied, so listing it at bare `"warn"`
publishes the rule without publishing a policy. This matches the three existing
`noRestricted*` rules, all of which sit at bare `"warn"` in both presets, and is
recorded as a requirement in this change's delta spec.

*Alternative considered:* shipping a starter `entries` list (e.g. banning
`require.ensure` or `__defineGetter__`). Rejected: any default set is a guess
about the consumer's codebase, it would be the first preset rule to carry an
opinionated deny-list, and consumer overrides of an array-valued option replace it
wholesale rather than extending it — so a default would be actively awkward to
opt out of, item by item.

### 3. Keep `warn` in `react-balanced`

Balanced relaxes rules that are purely stylistic, high-noise, or broadly-firing.
A rule that reports nothing under the presets' own configuration is none of those,
and balanced currently relaxes **zero** nursery rules, so relaxing this one would
be the odd entry out.

*Alternative considered:* `off` in balanced. Rejected — it would make the rule
invisible to balanced consumers who might want to configure it, at no noise
saving, since the rule is already silent.

### 4. Re-key version tracking on the pinned `$schema` target

The standing requirement keys the bump decision on the *installed* Biome version.
This pass is the counter-example: Dependabot moved the installed binary to 2.5.6
while the presets still pinned 2.5.5, so the "Already on latest" scenario matched
and directed *no* `$schema` bump — the opposite of what is needed. The pinned
`$schema` target is the consumer-visible fact and the correct signal; the installed
binary is incidental and independently movable.

*Alternative considered:* adding a fourth scenario for the split state while
leaving the existing signal alone. Rejected — it would leave two scenarios whose
WHEN clauses both match today, one of them wrongly.

### 5. Advance the declared range `^2.5.5` → `^2.5.6`

`^2.5.5` already admits 2.5.6, so this is not needed to resolve the dependency.
It is done anyway to keep the declared floor equal to the documented target — the
README instructs consumers to `pnpm add -D @biomejs/biome@^2.5.x`, and that line
should not advertise a floor below the `$schema` the presets pin. Matches the
`^2.5.4` → `^2.5.5` step in the previous pass.

### 6. `minor` changeset

A preset rule list changes, which the standing requirement pins as the `minor`
case, even though the added rule emits nothing until configured. The trigger is
the rule-list edit, not the observed diagnostic count.

## Risks / Trade-offs

- **Key order silently wrong** → `pnpm check` would not catch it, since it runs
  `biome format`, not `biome check`. Mitigated by inserting at the correct
  position (Decision 1) and running `biome check --write` before `pnpm check`.
- **`-stable` drift from hand-editing** → the `$schema` line in the two `-stable`
  files is tempting to edit directly. Mitigated by regenerating with
  `pnpm sync-stable` after the parents change; `check:sync-stable` fails the build
  on drift.
- **README counts drift out of sync** → three of the four `254` references and
  both `72` references sit in prose rather than a generated table. Mitigated by
  re-running the per-category count command from `CLAUDE.md` after the edit and
  reconciling every reference found by grepping for the literals.
- **A rule that never fires looks like dead config** → a consumer may read the
  entry as a bug. Mitigated by the README highlights entry naming it as
  configuration-required, consistent with how the `noRestricted*` family is
  already described.

## Migration Plan

No consumer migration. Existing configurations keep working unchanged: the added
rule produces no diagnostics until a consumer opts in by supplying `entries`, and
the `-stable` presets do not carry it at all. Rollback is reverting the change and
publishing the prior version; nothing is stateful.
