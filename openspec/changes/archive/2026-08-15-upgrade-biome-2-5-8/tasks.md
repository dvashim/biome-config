## 1. Re-verify the audit against upstream

- [x] 1.1 Re-confirm npm `latest` for `@biomejs/biome` is still `2.5.8` and that `package.json` still declares `^2.5.8`; if a newer release has landed since planning, stop and re-run the schema diff against it rather than proceeding
- [x] 1.2 Re-run the per-category rule-key diff of the 2.5.7 and 2.5.8 schemas and confirm exactly three nursery additions (`noInvalidPropertyInitValue`, `noSvelteLegacyConst`, `useReactCompiler`), zero removals, zero renames, zero graduations out of nursery
- [x] 1.3 Re-confirm via `biome explain` that `noInvalidPropertyInitValue` has no domain and is nursery-recommended, `useReactCompiler` is `react`-domain, and `noSvelteLegacyConst` is svelte-only
- [x] 1.4 Re-confirm no new option landed on any already-listed rule, and that no shared configuration block (`formatter`, `assist`, `files`, `javascript`, `json`, `html`, `vcs`) gained a key

## 2. Measure the cost the new requirement asks about

- [x] 2.1 Time a lint run over a React codebase with `useReactCompiler` at `warn` versus absent, and record the delta — this is the assessment the added requirement mandates, not an optional extra
- [x] 2.2 Record the same measurement for a codebase with **no** React dependency, since explicit listing runs the rule there too
- [x] 2.3 If the measured cost is severe rather than merely present, stop and revisit whether `react-strict` should list it at `warn`; report the numbers before changing the planned severity

## 3. Advance the pinned target to 2.5.8

- [x] 3.1 Update the `$schema` URL to `https://biomejs.dev/schemas/2.5.8/schema.json` in all six `dist/*.json` presets and in the root `biome.json`
- [x] 3.2 Update all five `2.5.7` references in `README.md` (the requirements table, the `$schema` prose, the example config, the "built and tested against" line, and the `pnpm add -D` snippet)
- [x] 3.3 Grep the whole repo for any surviving `2.5.7` reference and confirm only historical ones (archived planning artifacts, CHANGELOG) remain

## 4. Add the two in-scope rules

- [x] 4.1 Add `noInvalidPropertyInitValue` at `"warn"` to the `nursery` block of `dist/biome.react-strict.json` and `dist/biome.react-balanced.json`
- [x] 4.2 Add `useReactCompiler` at `"warn"` to `dist/biome.react-strict.json` and at `"off"` to `dist/biome.react-balanced.json`, both as bare severity strings with no `options` block
- [x] 4.3 Confirm `noSvelteLegacyConst` is absent from both presets, and that the exclusion reason is recorded in the change
- [x] 4.4 Run `biome check --write` so the `useSortedKeys` assist places the new entries correctly — string-valued rules sort before object-valued ones within a category
- [x] 4.5 Run `pnpm sync-stable` and confirm both `-stable` files change only in their `$schema` line, staying at 182 rules

## 5. Reconcile the README inventory

- [x] 5.1 Raise the `react-strict` and `react-balanced` totals 258 → 260 everywhere they appear (the ladder blurb, the preset table, and the strict section prose)
- [x] 5.2 Raise the nursery count 76 → 78 in both preset table rows
- [x] 5.3 Add both new rules to the nursery highlights
- [x] 5.4 Add a `useReactCompiler` row to the balanced relaxation table and raise its count 16 → 17
- [x] 5.5 Update the two statements reconciling relaxation counts so they read 15 of 17 in stable categories, with `react-balanced-stable` keeping exactly those 15
- [x] 5.6 Verify every published count against the presets using the per-category one-liner from `CLAUDE.md`, not by eye

## 6. Verify and land

- [x] 6.1 Run `pnpm run check` and confirm every check passes, including `check:sync-stable`
- [x] 6.2 Confirm each rule the README names exists in `dist/biome.react-strict.json` under the category the README claims
- [x] 6.3 Add a `minor` changeset naming both added rules and the 2.5.8 target
- [x] 6.4 Open a PR to `main` and confirm the `Check` workflow passes
