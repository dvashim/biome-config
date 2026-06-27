## Why

The `up` branch was upgrading the published presets to **Biome 2.5.1**: it bumped the tooling (`package.json`, `biome.json`, `pnpm-lock.yaml`, `README.md`) and regenerated the six `dist/` files (Biome 2.5.x graduated **34** rules out of `nursery` into stable categories, taking nursery from 100 → 63). **The `dist/` regeneration and the `biome-2-5-1` changeset were then reverted to 2.4.16**, leaving an inconsistent tree — tooling at **2.5.1** but `dist/` presets back at **2.4.16**. This change re-applies the dist upgrade cleanly and folds in the opt-in rule reconciliation, so the presets land on a correct, complete 2.5.1.

## What Changes

**Upgrade `dist/` presets 2.4.16 → 2.5.1** (re-doing the reverted work; tooling is already 2.5.1):

- Bump `$schema` to `2.5.1` in all six `dist/` files.
- **Rename 3 rules** (preserve severity): `noMultiStr` → `noMultilineString`, `useFind` → `useArrayFind`, `useSpread` → `useSpreadOverApply`.
- **Drop `noFloatingClasses`** — removed in 2.5.1 with no replacement.
- **Relocate 32 graduated rules** from `nursery` to their 2.5.1 stable categories (→ suspicious 14, → style 11, → complexity 3, → correctness 2, → performance 2, → a11y 1, → security 1), **preserving each preset's severity** per the graduation invariant.

**Reconcile opt-in coverage** (on the migrated 2.5.1 baseline of 214 rules):

- **Add 41 in-scope non-recommended rules** at `warn` — including 9 Next.js and 4 React Native rules (per the expanded scope): e.g. `useExhaustiveDependencies`, `useHookAtTopLevel`, `noDangerouslySetInnerHtml`, `noImgElement`, `noReactNativeRawText`.
- **Remove 2 rules** that graduated into a recommended-stable slot at default severity (`noDuplicateEnumValues`, `noProto`) — now redundant via `recommended: true`.
- **Balanced relaxations**: in `react-balanced`, relax broadly-firing framework rules (notably `noImgElement`) and stylistic / high-noise additions.

**Finalize**: `biome format --write`, `pnpm sync-stable` (the 32 relocated rules now flow into the `-stable` variants), `pnpm check`, and a Changeset. **Final preset size: 253 rules** (214 − 2 + 41).

### Still out of scope (excluded)

- Vue / Solid / Qwik / Svelte / Astro framework domains and GraphQL language rules.
- Recommended stable rules already active via `recommended: true`.
- The 10 flagged deliberate overrides of recommended rules remain intact.

## Capabilities

### New Capabilities

- `linter-rule-coverage`: which Biome rules the `react-strict` / `react-balanced` presets explicitly enumerate, plus how the presets track a Biome version upgrade — graduated nursery rules relocated with severity preserved, renamed rules migrated, removed rules dropped, every in-scope opt-in rule enabled (incl. Next.js / React Native), no redundant recommended-stable rules, `-stable` derived without nursery.

### Modified Capabilities

<!-- None. openspec/specs/ is empty; this introduces the first capability spec. -->

## Impact

- **Files changed**: all six `dist/*.json` regenerated for 2.5.1 (schema bump + 3 renames + 1 removal + 32 graduations + 41 adds + 2 removals), `-stable` variants regenerated, and a new `.changeset/*.md`. `package.json`, `biome.json`, `README.md`, `pnpm-lock.yaml` are already at 2.5.1 (not reverted) — confirm `README.md` rule references.
- **`-stable` variants gain the 32 graduated rules** (no longer nursery) and the 41 stable additions.
- **Consumer effect**: graduations are largely transparent (same rules, new categories, same severity); `noFloatingClasses` disappears; ~41 new `warn`-level diagnostics surface (mostly self-scoping; `noImgElement` fires broadly, so balanced relaxes it).
- **Tooling**: `pnpm sync-stable`, `pnpm check`, `pnpm changeset`.
