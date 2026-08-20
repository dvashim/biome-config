## 1. Re-verify the audit against upstream

- [x] 1.1 Re-confirm npm `latest` for `@biomejs/biome` is still `2.5.9` and that `package.json` declares `^2.5.9`; if a newer release has landed since planning, stop and re-run the schema diff against it rather than proceeding
- [x] 1.2 Re-run the per-category rule-key diff of the 2.5.8 and 2.5.9 schemas and confirm exactly five nursery additions (`noUnsafeTypeAssertion`, `useControlLabel`, `useNamedLayer`, `useTailwindShorthandClasses`, `useAstroClientOnlyDirectiveValue`), zero removals, zero renames, zero graduations out of nursery
- [x] 1.3 Re-confirm via `biome explain` that the first four carry no framework-only domain and that `useAstroClientOnlyDirectiveValue` is astro-only
- [x] 1.4 Re-confirm no new option landed on any already-listed rule, that all four in-scope additions declare empty options objects, and that no shared configuration block (`formatter`, `assist`, `files`, `javascript`, `json`, `html`, `vcs`) gained a key — the only non-rule schema change should be the new `astro` variant in `RuleDomain`
- [x] 1.5 Re-run the full coverage audit (`biome explain` over all 522 rules) and confirm the four additions are the only in-scope absences from `react-strict` — no pre-existing gap

## 2. Re-confirm the measurements the specs require

- [x] 2.1 Re-run the `useTailwindShorthandClasses` gating fixtures — identical sources, `tailwindcss` present in one `package.json` and absent from the other — and confirm the rule reports identically in both, so the recorded finding (gate defeated) still holds
- [x] 2.2 Confirm the same rule reports **zero** against a real codebase that does not use Tailwind, so reach without noise is re-established rather than inherited from planning; if it now reports, stop and revisit the balanced severity before editing the presets
- [x] 2.3 Re-confirm `noUnsafeTypeAssertion`'s volume against real React/TypeScript sources and record the count; if it comes in dramatically lower than the recorded ~1 per 6 files, report the number before keeping `off` in balanced
- [x] 2.4 Re-confirm `useControlLabel` and `useNamedLayer` fire on their bad cases and stay silent on the good ones, so their zero counts are silence rather than inertness

## 3. Advance the pinned target to 2.5.9

- [x] 3.1 Update the `$schema` URL to `https://biomejs.dev/schemas/2.5.9/schema.json` in all six `dist/*.json` presets and in the root `biome.json`
- [x] 3.2 Update all five `2.5.8` references in `README.md` (the requirements table, the `$schema` prose, the example config, the "built and tested against" line, and the `pnpm add -D` snippet)
- [x] 3.3 Grep the whole repo for any surviving `2.5.8` reference and confirm only historical ones (archived planning artifacts, `CHANGELOG.md`) remain

## 4. Add the four in-scope rules

- [x] 4.1 Add `useControlLabel`, `useNamedLayer`, and `useTailwindShorthandClasses` at `"warn"` to the `nursery` block of both `dist/biome.react-strict.json` and `dist/biome.react-balanced.json`
- [x] 4.2 Add `noUnsafeTypeAssertion` at `"warn"` to `dist/biome.react-strict.json` and at `"off"` to `dist/biome.react-balanced.json`
- [x] 4.3 Confirm all four are bare severity strings with no `options` block
- [x] 4.4 Confirm `useAstroClientOnlyDirectiveValue` is absent from both presets, and that the exclusion reason is recorded in the change
- [x] 4.5 Run `biome check --write` so the `useSortedKeys` assist places the new entries correctly — string-valued rules sort before object-valued ones within a category
- [x] 4.6 Run `pnpm sync-stable` and confirm both `-stable` files change only in their `$schema` line, staying at 182 rules

## 5. Reconcile the README inventory

- [x] 5.1 Raise the `react-strict` and `react-balanced` totals 260 → 264 everywhere they appear (the ladder blurb, the preset table, and the strict section prose)
- [x] 5.2 Raise the nursery count 78 → 82 in both preset table rows and the nursery section heading
- [x] 5.3 Add all four new rules to the nursery highlights
- [x] 5.4 Add a `noUnsafeTypeAssertion` row to the balanced relaxation table and raise its count 17 → 18
- [x] 5.5 Update the two statements reconciling relaxation counts so they read 15 of 18 in stable categories, name all **three** nursery relaxations (`noTailwindArbitraryValue`, `useReactCompiler`, `noUnsafeTypeAssertion`), and keep `react-balanced-stable` at exactly those 15
- [x] 5.6 Add **Astro** to the strict section's list of intentionally omitted frameworks, now that Biome has an `astro` domain and the presets exclude a rule for it
- [x] 5.7 Verify every published count against the presets using the per-category one-liner from `CLAUDE.md`, not by eye

## 6. Correct the repo's own documentation

- [x] 6.1 Update `CLAUDE.md`'s rule-count prose — it describes `react-strict` as "254 explicit rule entries across 8 categories (72 of them nursery)" and `react-balanced` as the same 254, against an actual 260 / 78 before this change and 264 / 82 after

## 7. Verify and land

- [x] 7.1 Run `pnpm run check` and confirm every check passes, including `check:sync-stable`
- [x] 7.2 Confirm each rule the README names exists in `dist/biome.react-strict.json` under the category the README claims
- [x] 7.3 Add a `minor` changeset naming the four added rules, the 2.5.9 target, **and** the HTML formatter output changes that reach every preset including the ones whose rule lists do not move
- [x] 7.4 Commit the already-uncommitted dev-dependency bump (`@biomejs/biome`, `@changesets/cli`, `publint`, pnpm `packageManager`) as part of this change
- [x] 7.5 Open a PR to `main` and confirm the `Check` workflow passes
