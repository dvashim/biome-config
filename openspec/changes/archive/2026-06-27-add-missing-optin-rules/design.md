## Context

The repo is in a **mid-revert state**. The `up` branch upgraded the tooling to Biome **2.5.1** (`package.json`, `biome.json`, `pnpm-lock.yaml`, `README.md`, installed binary) and regenerated the six `dist/` presets for 2.5.1 — but the **dist regeneration and the `biome-2-5-1` changeset were reverted to 2.4.16**. Current working tree: tooling at **2.5.1**, `dist/` presets at **2.4.16** (215 listed rules per preset, `nursery` = 100).

Biome 2.5.x is a substantial reorganization vs 2.4.16: of the 215 listed rules, **34 graduated** out of `nursery` into stable categories, **3 were renamed**, and **1 (`noFloatingClasses`) was removed**. So bringing `dist/` to 2.5.1 is a real migration, not a schema-string bump. 2.5.1 is also the latest stable release (npm `dist-tags.latest`), so it is the right target.

Classification uses the installed **2.5.1** binary (`biome explain` → recommended status, default severity, diagnostic category, domains) plus the 2.5.1 JSON schema `$defs`. The baseline listed set is read from the current **2.4.16** `dist/` files; the migration is computed by joining the two.

## Goals / Non-Goals

**Goals:**
- Bring the six `dist/` presets to a correct, complete Biome 2.5.1 (schema + graduations + renames + removal).
- Reconcile opt-in coverage: enable every in-scope non-recommended 2.5.1 rule (incl. Next.js / React Native); drop redundant recommended rules.
- Keep `-stable` derivation correct and `pnpm check` green.

**Non-Goals:**
- Reverting the tooling to 2.4.16 (it is intentionally on 2.5.1).
- Switching the presets to a `domains` key.
- Modifying `recommended` / `react-recommended`.
- Adding GraphQL or Vue/Solid/Qwik/Svelte/Astro rules.
- Re-deciding the 10 flagged overrides of recommended rules.

## Decisions

**1. Target = Biome 2.5.1 for `dist/` too.** The tooling is already 2.5.1 and 2.5.1 is the latest stable; a `dist/` at 2.4.16 while `biome.json` is 2.5.1 is incoherent (the repo extends `dist/biome.recommended.json`). Bump `$schema` 2.4.16 → 2.5.1 in all six dist files. *Alternative:* revert tooling to 2.4.16 — rejected; it discards the intended upgrade and the README/lock work that was deliberately kept.

**2. Migration before reconciliation.** Apply the 2.4.16 → 2.5.1 rule changes first (rename 3, drop 1, relocate 34 graduated), then reconcile opt-in coverage on the resulting 2.5.1 baseline (214 rules). The migration set is computed by joining the 2.4.16 listed names against each rule's 2.5.1 diagnostic category from `biome explain`.

**3. Graduations preserve severity (the invariant, now active).** The 34 graduated rules move from `nursery` to their 2.5.1 categories at the **same severity, per variant**. Of these, **2** (`noDuplicateEnumValues`, `noProto`) graduate into a *recommended-stable* slot at default severity → dropped as redundant (interaction with Decision 6); the other **32** are relocated and kept. Relocation makes them flow into the `-stable` variants (which strip only nursery).

**4. Renames preserve severity; removals drop.** `noMultiStr` → `noMultilineString`, `useFind` → `useArrayFind`, `useSpread` → `useSpreadOverApply` (the 2.5.1 binary rejects the old names; confirm each mapping against the Biome 2.5.0/2.5.1 changelog at apply). `noFloatingClasses` has no successor → dropped.

**5. Classification against the 2.5.1 binary.** In scope = pure-language rules, or the `react` / `next` / `test` / `project` domains, or React Native; excluded = GraphQL and Vue/Solid/Qwik/Svelte/Astro. Auto-on = globally recommended AND non-nursery. (Same policy as prior revisions; Next.js + React Native are in scope.)

**6. Removal limited to redundancy** — recommended, stable, listed at Biome default severity with no options. Overrides preserved.

**7. Additions default to `warn`**; `react-balanced` relaxes stylistic / high-noise / broadly-firing framework rules. Framework rules are enabled by explicit listing (no `domains` key), so they apply regardless of project type — most self-scope, but `noImgElement` fires broadly, so balanced relaxes it.

**8. Key ordering is tool-enforced** (`useSortedKeys`, `groupByNesting`): simple-string-value rules precede object-value rules within a category. Run `biome format --write` then `pnpm check`.

## Risks / Trade-offs

- **Rename mapping is inferred** (the 2.5.1 binary rejects old names, so the mapping is by name/semantics) → confirm each against the Biome 2.5.0/2.5.1 changelog before applying; if a "rename" is really a removal, drop it.
- **The schema bump may surface further deprecated/removed rules** beyond the 4 detected → `pnpm check` against the 2.5.1 binary is the gate; resolve any diagnostics it raises.
- **`-stable` grows** by the 32 relocated rules plus stable additions → expected; verify `pnpm sync-stable` output and that each `-stable` equals its parent minus nursery.
- **Mid-revert inconsistency** (tooling 2.5.1 vs dist 2.4.16) is resolved by this change; until applied, the repo's own `biome.json` (2.5.1) extends a 2.4.16 preset.
- **Framework-rule noise** (`noImgElement` on any `<img>`) → balanced relaxes the broadly-firing ones.
- **Removal assumes default severity** → confirm `noProto` / `noDuplicateEnumValues` are at their Biome default before dropping.

## Migration Plan

1. Bump `$schema` 2.4.16 → 2.5.1 in the six dist files; confirm `biome.json` / `README.md` already reference 2.5.1 and fix any stale rule counts in `README.md`.
2. Migrate rules: 3 renames (preserve severity), drop `noFloatingClasses`, relocate 32 graduated rules (preserve severity, per variant), drop the 2 redundant graduated rules.
3. Add the 41 in-scope opt-in rules at `warn`; apply balanced relaxations.
4. `biome format --write`; `pnpm sync-stable`; `pnpm check` (must pass against the 2.5.1 binary).
5. `pnpm changeset` (**minor** — version upgrade + new diagnostics).

**Rollback:** revert the dist edits and regenerated `-stable` files (one commit); the tooling stays at 2.5.1.

## Open Questions

- Confirm the 3 rename mappings and that `noFloatingClasses` has no successor (Biome 2.5.0 / 2.5.1 changelog).
- Should the ~5 option-required `noRestricted*` rules ship with starter options, be added bare at `warn`, or be deferred?
- Should CI assert the dist `$schema` equals the installed Biome version, to prevent another tooling↔dist drift? (Follow-up.)
