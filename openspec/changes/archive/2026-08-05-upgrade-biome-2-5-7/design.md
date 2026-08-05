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
- Measured starting state: `react-strict` and `react-balanced` each list 255
  rules (nursery 73), both `-stable` variants list 182, all 73 nursery entries
  are **identical** across strict and balanced, and all 15 balanced relaxations
  live in stable categories. The installed binary is already 2.5.7 and
  `pnpm check` passes against it, so this upgrade carries no formatter or parser
  drift for the repo's own files.
- Nursery severities are not uniform today: `noMisusedPromises` sits at `error`
  (raised from Biome's `info`) and `useExplicitType` at `off`. Severity in these
  presets is chosen, not inherited.

## Goals / Non-Goals

**Goals:**

- Land the 2.5.6 → 2.5.7 target bump and the three rule additions as one
  reviewable change, with the audit evidence recorded rather than implied.
- Keep the `-stable` variants mechanically derived and drift-free.
- Decide the balanced severity for each addition on the standing convention, and
  absorb the bookkeeping consequences of the first relaxation that cannot reach
  `react-balanced-stable`.
- Close the one measurable dev-tooling currency gap (pnpm) in the same pass,
  since the branch already carries the other dependency bumps.

**Non-Goals:**

- Re-auditing rules that predate 2.5.7. The scope is the 2.5.6 → 2.5.7 delta.
- Choosing a Tailwind policy for consumers. `noTailwindArbitraryValue` ships with
  no `attributes` / `functions` options; both are consumer decisions.
- Suppressing the new `useNullishCoalescing` `if`-statement diagnostics on
  consumers' behalf (see Decision 5).
- Moving Node's `engines` floor or `.node-version`, or touching CI workflows.

## Decisions

### 1. Insert all three rules as bare strings at their alphabetical positions

`noExtendNative` goes between `noExcessiveSelectorClasses` and
`noFloatingPromises`; `noNonScalableViewport` between `noNegationInEqualityCheck`
and `noPlaywrightElementHandle`; `noTailwindArbitraryValue` between
`noRestrictedDependencies` and `noTopLevelLiterals`. All three are string-valued,
as are all 73 existing nursery entries, so `groupByNesting` has no effect here and
the inserts are plain alphabetical — including balanced's `"off"` entry, which is
still a string and therefore keeps the same position as strict's `"warn"`.

*Alternative considered:* appending and letting `biome check --write` sort them.
Rejected as the primary approach — it works, but placing them correctly keeps the
diff to three lines per preset and makes the sort a verification step rather than
a repair step.

### 2. `noExtendNative` and `noNonScalableViewport` at `warn` in both presets

Both flag narrow, unambiguous anti-patterns — patching a built-in prototype, and
`user-scalable=no` in a viewport meta tag — with no meaningful false-positive
surface and no dependency on a consumer's framework. Neither is stylistic,
high-noise, or broadly firing, so the balanced relaxation criteria do not apply
and balanced matches strict.

`noNonScalableViewport` is listed at `warn` even though Biome's default severity
is `error`. The house convention lands additions at `warn`, and here that also
protects consumers: `error` fails `biome ci` by default, so inheriting it would
let a preset bump turn a consumer's build red on a rule they never opted into. A
consumer who wants it enforced raises it in one line.

*Alternative considered:* keeping `error` for `noNonScalableViewport`, citing
`noMisusedPromises`. Rejected — that entry *raises* Biome's `info` default for a
whole class of runtime bugs, a deliberate choice made in an earlier pass; it is
not a precedent for inheriting upstream `error` defaults automatically.

### 3. `noTailwindArbitraryValue` — `warn` in strict, `off` in balanced

Arbitrary values (`w-[400px]`, `text-[#555]`, `[color:red]`) are a Tailwind
feature, not a mistake. Strict's job is to make the policy question visible, so it
lists the rule at `warn`. Balanced targets real-world projects, where a codebase
that uses Tailwind normally will trip this rule repeatedly on deliberate code —
squarely the "purely stylistic, high-noise" case the severity convention assigns
to balanced, and the same shape as `noJsxLiterals` (off, "allows inline text in
JSX") and `noNestedTernary` (off). Outside Tailwind the rule is effectively
silent, so strict's `warn` costs non-Tailwind consumers nothing.

*Alternatives considered:* `info` in balanced — rejected: balanced reserves `info`
for rules it still wants surfaced (`noMagicNumbers`, `noContinue`), whereas
arbitrary values are a pattern balanced should simply permit. `warn` in both —
rejected: it would make balanced noisier than strict-lite on ordinary Tailwind
code, which is the opposite of the preset's purpose.

### 4. Accept the first nursery relaxation and split the README's relaxation count

Decision 3 breaks two incidental invariants: nursery entries are no longer
identical across strict and balanced, and not every relaxation lives in a stable
category. Neither is required by the specs — the first was a coincidence of the
rules added so far, and the second is a README statement of fact that is now
false. `scripts/sync-stable.ts` is unaffected: it strips the whole nursery block
from both parents, so `react-balanced-stable` keeps exactly its 15 stable
relaxations and neither `-stable` file changes except in `$schema`.

The README consequence is bookkeeping: the balanced row reports **16 relaxed**,
the balanced-stable row stays at **15 relaxed**, the "15 targeted relaxations"
heading becomes 16, and the two sentences asserting that every relaxation carries
into `-stable` are rewritten to name the 15/16 split. Recorded as a requirement in
this change's delta spec so the next nursery relaxation follows the same shape.

### 5. Audit `ignoreIfStatements`, adopt nothing

Biome 2.5.7 adds `ignoreIfStatements` (default `false`) to `useNullishCoalescing`
and, with it, reports `if (!a) { a = b }` as a candidate for `a ??= b`. Both
presets already list the rule at bare `"warn"` and keep it there, so both inherit
the new default.

For strict this is simply the stricter reading. For balanced the rewrite is
mechanical, safe, and local — not the sort of broad noise balanced relaxes — and
setting the option there would carry a structural cost: it would be the first
object-valued entry in a nursery block, so `groupByNesting` would push
`useNullishCoalescing` to the end of balanced's nursery category and leave the two
presets' nursery blocks ordered differently for the life of the entry. Not worth
it for one idiom. Consumers who disagree set one option.

*Alternative considered:* setting `ignoreIfStatements: true` in balanced.
Rejected for the reasons above; recorded in the delta spec as the general rule —
a new option is adopted only where the preset disagrees with its default.

### 6. Advance the pnpm pin, adopt the dependency bumps already in the tree

`packageManager` moves `pnpm@11.18.0` → `pnpm@11.20.0` via `corepack use
pnpm@11.20.0`, which rewrites the field with the correct hash rather than one
pasted by hand (expected:
`pnpm@11.20.0+sha512.9a6f330a95b66446ea088faf1521405a8a01f07fde7124cc9958dfed52d4bb436737e65b08f85f37b46fcba375092558ac51262b816844b22f63406ed166bfee`).
`@types/node@^26.1.2` and `publint@^0.3.23` are already in the working tree and
already equal npm `latest`, so they are adopted and verified, not re-derived.
TypeScript, both Changesets packages, and the OpenSpec CLI are current.

*Alternative considered:* leaving pnpm for a separate change. Rejected — the
standing `dev-tooling-currency` requirement is a tracking obligation, the bump is
within pnpm 11, and both CI workflows install through the same pin, so it is
verified by the same `pnpm install` + `pnpm check` this change already runs.

### 7. `minor` changeset, naming all three rules

Preset rule lists change, which the standing requirement pins as the `minor`
case. The dev-tooling half of the change publishes nothing and adds no second
changeset. The changeset text names the three rules, the balanced `off` for
`noTailwindArbitraryValue`, and the 2.5.7 target, and flags the inherited
`useNullishCoalescing` behavior change so consumers can attribute the new
diagnostics correctly.

## Risks / Trade-offs

- **Key order silently wrong** → `pnpm check` would not catch it, since it runs
  `biome format`, not `biome check`. Mitigated by inserting at the correct
  positions (Decision 1) and running `biome check --write` before `pnpm check`.
- **`-stable` drift from hand-editing** → the `$schema` line in the two `-stable`
  files is tempting to edit directly. Mitigated by regenerating with
  `pnpm sync-stable`; `check:sync-stable` fails the build on drift.
- **README counts drift out of sync** → this pass touches more literals than the
  last one (`255`→`258` in four places, `73`→`76` in three, `15`→`16` in two) and
  three literals must deliberately **not** change: both `182` totals and
  balanced-stable's `15 relaxed`. Mitigated by re-running the per-category count
  command from `CLAUDE.md` and reconciling every literal by grep rather than by
  memory.
- **Strict consumers on Tailwind get a burst of new diagnostics** → a large
  Tailwind codebase can light up on first upgrade. Mitigated by the severity
  (`warn` does not fail `biome ci`), by balanced shipping it `off`, and by the
  README naming the rule and the relaxation.
- **`noNonScalableViewport` at `warn` is quieter than upstream** → a consumer who
  expects Biome's `error` gets a warning instead. Accepted: the presets choose
  severities (Context), and under-escalating on a preset bump is the safer
  default.
- **pnpm pin bump affects CI** → both workflows install through
  `packageManager`. Mitigated by writing the pin with `corepack use` and
  re-running `pnpm install` and `pnpm check` locally before the PR; a bad hash
  fails immediately and loudly.

## Migration Plan

No consumer migration. Existing configurations keep working: the two new
always-on rules flag narrow anti-patterns at `warn`, the Tailwind rule is `off` in
balanced, and the `-stable` presets carry none of the three. Consumers who also
move their own Biome to 2.5.7 will see new `useNullishCoalescing` diagnostics from
Biome itself; the changeset says so. Rollback is reverting the change and
publishing the prior version; nothing is stateful.
