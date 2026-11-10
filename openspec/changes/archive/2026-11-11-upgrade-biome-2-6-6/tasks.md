# Tasks

## 1. Starting state and the dependency range

- [x] 1.1 Confirm the starting state rather than assuming it, and verify each of these:
  - `pnpm exec biome --version` reports 2.6.5;
  - `git show HEAD:package.json` declares `"@biomejs/biome": "^2.6.2"`;
  - all six `dist/*.json` presets and `biome.json` pin `schemas/2.6.2`;
  - `node scripts/check-presets.ts` prints `presets check out against Biome 2.6.2: 607 rules classified, 313 listed, 0 unaccounted`.

  Then list the working-tree changes that are not this change's (design, Context): the `spec-driven` switch, `packageManager` pnpm 12.18.0 and its lockfile hunks, and the comment edit in `scripts/sync-rule-metadata.ts`. Leave them in place, unreverted.

  **Result:** all four confirmed (2.6.5; `^2.6.2`; seven `schemas/2.6.2` pins; `607 rules classified, 313 listed, 0 unaccounted`). Not this change's, left in place:
  - the `spec-driven` switch: `openspec/config.yaml`, the deleted `openspec/schemas/intent-first/`, `docs/adr/`, `docs/intents/`, `.claude/hooks/intent-gate.mjs`, and `.claude/settings.json`, the regenerated `.claude/` OpenSpec assets, and `CLAUDE.md`;
  - `packageManager` pnpm 12.18.0 with its `pnpm-lock.yaml` hunks;
  - the ADR references removed from `scripts/sync-rule-metadata.ts`'s comments.
- [x] 1.2 Set `"@biomejs/biome": "^2.6.6"` in `package.json` and run `pnpm install`. Verify:
  - `pnpm exec biome --version` reports 2.6.6;
  - the lockfile importer records `specifier: ^2.6.6` and `version: 2.6.6`;
  - `pnpm install --frozen-lockfile` succeeds.

  Record which hunks of `git diff HEAD -- package.json pnpm-lock.yaml` are this change's (design decision 16).

  **Result:** `pnpm install` replaced 2.6.5 with 2.6.6. `pnpm exec biome --version` reports 2.6.6, and `pnpm install --frozen-lockfile` reports "Lockfile is up to date". This change's hunks:
  - `package.json`'s `"@biomejs/biome": "^2.6.2"` → `"^2.6.6"`;
  - the lockfile importer: `specifier: ^2.6.2`, `version: 2.6.5` → `specifier: ^2.6.6`, `version: 2.6.6`;
  - the `@biomejs/biome` and ten `@biomejs/cli-*` package and snapshot entries, 2.6.5 → 2.6.6.

  Not this change's: the `packageManager` line and every `@pnpm/exe.*` / `pnpm` entry (12.15.0 → 12.18.0).

## 2. Advance the pinned target and regenerate the snapshot

- [x] 2.1 Before any pin moves, preview `pnpm exec biome migrate` (no `--write`) with the installed 2.6.6 against scratch copies of the six presets and the root `biome.json`. Record in design decision 15 each rewrite it proposes, as adopted or declined. Verify that decision 15 names every file and its outcome.
- [x] 2.2 Advance the pins in one step:
  - `$schema` → `schemas/2.6.6` in the four hand-maintained presets and `biome.json`;
  - the seven Biome version references in `README.md`, including the Requirements row as `**2.6.6+**` and `pnpm add -D @biomejs/biome@^2.6.6`;
  - drop `"!pnpm-lock.yaml"` from `biome.json`'s `files.includes`.

  Then regenerate the `-stable` files with `pnpm sync-stable`; they must never be hand-edited. Verify:
  - `git diff dist/*-stable.json` changes only `$schema`;
  - `pnpm run check:sync-stable` and `pnpm run check:format` pass;
  - `pnpm exec biome format pnpm-lock.yaml` processes no file, because Biome protects it.

  **Result:** all seven pins and the seven README references now name 2.6.6, with no `2.6.2` left in the README; `files.includes` is `["**", "!**/*.md"]`. The `-stable` diffs are the `$schema` line alone, and `check:sync-stable` passes. `check:format` checked 41 files and applied no fixes. `biome format pnpm-lock.yaml` processed 0 files and listed the lockfile as "provided but ignored", with no configuration excluding it.
- [x] 2.3 Correct `CLAUDE.md`'s root-configuration paragraph: `files.includes` now keeps only Markdown out, and Biome protects `pnpm-lock.yaml` itself since 2.6.4. Verify with `grep -n "pnpm-lock" CLAUDE.md` that no sentence still says the root configuration excludes the lockfile.
- [x] 2.4 Run `pnpm sync-rule-metadata`, then verify:
  - it reports `767 rules at Biome 2.6.6 (installed)`;
  - the `audit/rule-metadata.json` diff matches design decision 1: 160 added entries, all `nursery`; none removed; no category move; one changed entry, `useLogicalProperties` languages `css` → `css`, `scss`;
  - `pnpm run check:rule-metadata` passes without fetching.

  **Result:** `wrote audit/rule-metadata.json — 767 rules at Biome 2.6.6 (installed)`.
  - Against `HEAD`: 607 → 767, with 160 added (all `nursery`), 0 removed, and 0 moved. The one changed entry is `useLogicalProperties` (`["css"]` → `["css","scss"]`).
  - The file is byte-identical to the scratch sweep made earlier with a fetched 2.6.6.
  - `check:rule-metadata` reports `matches Biome 2.6.6 (installed) — 767 rules`.
- [x] 2.5 Re-measure the sweep and `--check` timings at 767 rules. Update `CLAUDE.md`'s "~6s for every rule" and "about 24 s instead of 11 s" if they moved, and verify the published figures match the measurement. If they did not move, leave them.

  **Result:** they moved, and `CLAUDE.md` is updated:
  - the sweep takes about 28 s for 767 rules (28.6 s measured);
  - `--check` takes about 80 s in the split state (85.3 s and 80.8 s) instead of 28 s installed (27.5 s and 28.5 s).

  The cause is mostly process startup: every 2.6.6 process starts in 0.19 s against 2.6.2's 0.01 s, measured side by side. This is recorded in design decisions 12 and 14.
- [x] 2.6 Preview `pnpm exec biome migrate` again against the advanced presets and `biome.json`, and verify it reports every file up to date.

  **Result:** all seven copies report "Your configuration file is up to date.", and in the repository itself migrate reports `biome.json: no migration needed`.

## 3. Scope: SCSS and the ledger

- [x] 3.1 In `scripts/check-presets.ts`:
  - add `scss` to `IN_SCOPE_LANGUAGES`;
  - update the comment above it to say why SCSS is named on its own: Biome tags its examples apart from CSS;
  - update the unnamed-domain list in that comment (`types`, `playwright`, `drizzle`, `tailwind`, `tanstackQuery`, `turborepo`).

  Verify red to green on a scratch copy that lists `noMissingScssInterpolation` in `react-strict` and `react-balanced`: listed-rule scope fails naming it without the edit, and passes with it. Then verify `pnpm run check:types` passes.

  **Result:**
  - **Red:** `listed-rule scope: 2 listed rule(s) the presets should not enumerate`, naming `noMissingScssInterpolation (languages: scss, domains: none)` in both parents.
  - **Green:** no listed-rule-scope problem, and the rule is named nowhere in the output. Coverage reports the 68 additions not yet listed.
  - `check:types` passes.
- [x] 3.2 Add `useConsistentUnicodeBom` to `audit/rule-exclusions.json` with direction `in`. Its reason: a rule for every file type the presets cover, correctly listed; its documentation shows only Markdown examples, so its metadata reads it as a Markdown rule; it reports a leading byte order mark in JavaScript, TypeScript, CSS, JSON, and HTML files (measured with 2.6.6; its release note lists the same languages); listed at warn in both presets.

  Re-run design decision 4's fixture with the installed 2.6.6 and verify the six file types still report. Then verify red to green on a scratch copy that lists the rule: listed-rule scope flags it without the entry, and passes with it.

  **Result:**
  - **Fixture:** the installed 2.6.6 reports `.js`, `.ts`, `.css`, `.json`, `.html`, and `.md` (6 warnings).
  - **Red:** listed-rule scope names `useConsistentUnicodeBom (languages: md, domains: none)` in both parents.
  - **Green:** no listed-rule-scope or ledger problem, and the rule is named nowhere in the output. The ledger file formats cleanly.
- [x] 3.3 Bring `CLAUDE.md` in line with the scope:
  - the In scope bullet gains `scss`;
  - the framework-rules sentence gains TanStack Query;
  - the listed-rule-scope paragraph's list of unnamed domains gains `tanstackQuery`;
  - the ledger paragraph names three entries, describing `useConsistentUnicodeBom` beside `noRestrictedTypes` and `noEmptySource`.

  Verify by grep that each of the four edits is present.

## 4. List the 70 additions

- [x] 4.1 Add the 70 in-scope additions (design decision 2) under `nursery`:
  - in `dist/biome.react-strict.json`, all at `warn`;
  - in `dist/biome.react-balanced.json`, at decision 5's levels: `off` for `noArrayForEach`, `noDanglingUnderscore`, `noNull`, `noSyncMethods`, `useIteratorZip`, `usePackageJsonCpu`, and `useTailwindVariablesShorthand`; `info` for `usePackageJsonEngines`; `warn` for the rest;
  - `noShortTimeValues` as a bare `warn` in both.

  Run `pnpm exec biome check --write` so the `useSortedKeys` assist orders them. Verify:
  - each parent lists 383 rules, 155 of them in `nursery`;
  - balanced differs from strict in exactly 41 entries;
  - `node scripts/check-presets.ts` reports no coverage, placement, existence, redundancy, parity, or listed-rule-scope problem, so that only the README inventory fails.

  **Result:**
  - The list came from the snapshot diff, less the 84 Vue, 5 Svelte, and 1 YAML rules: exactly 70.
  - Both parents list 383 rules: a11y 8, complexity 22, correctness 31, nursery 155, performance 11, security 5, style 92, suspicious 59.
  - Balanced differs from strict in 41 entries (26 nursery, 15 stable). The object-valued `useExhaustiveSwitchCases` stays last in strict's `nursery`.
  - Each parent's diff removes only the old `$schema` line, plus a trailing-comma change on balanced's former last entry.
  - `check:presets` reports only `README inventory`, and `biome format dist/` applies no fixes.
- [x] 4.2 Run `pnpm sync-stable` and verify that it leaves both `-stable` files byte-identical to step 2.2's output, since nursery is stripped, and that `pnpm run check:sync-stable` passes.
- [x] 4.3 Reconcile the README inventory (design decision 11).

  Edits the checker verifies:
  - `up to 383 explicitly configured rules`;
  - the Configurations table (`383` / `155`, `383, 41 relaxed` / `155`; `-stable` rows unchanged);
  - `nursery (155 rules)`;
  - `**41 targeted relaxations**` and `of the 41 relaxations`;
  - eight `nursery` relaxation rows in alphabetical position, each with its ground.

  Edits no matcher reads:
  - the React strict sentence's `**383 rules**`;
  - the nursery note's 26 relaxed names;
  - "the twenty-six nursery relaxations" in the balanced-stable section;
  - the scope sentence gaining SCSS;
  - highlights for TanStack Query, `noMissingScssInterpolation`, and the `package.json` field rules.

  Verify that `node scripts/check-presets.ts` passes in full, and that `grep -nE "313|\b85 rules|the 33|eighteen" README.md` finds no stale count.

  **Result:** `presets check out against Biome 2.6.6: 767 rules classified, 383 listed, 0 unaccounted`. The grep finds nothing, and the relaxation table's 26 nursery rows match the 26 names in its note.

## 5. Settle the levels with fixtures

- [x] 5.1 Build the fixture set in a scratch directory outside the repository. It extends copies of the new `react-strict` and `react-balanced` with `vcs.enabled: false`, and declares `react` 19.

  Re-run design decision 5's probe. Verify that every row reproduces, and record any difference in decision 5 before acting on it.
- [x] 5.2 Run the gate tests for the ten dependency-gated additions, as the standing gating requirement demands.

  Fixture directories: no dependency, `@playwright/test`, `@tanstack/react-query`, `vitest`, `next`, and `react-native`. Each runs the rule's documented invalid form, plus look-alikes outside the framework, among them:
  - `.first()`, `.last()`, and `.nth()` on non-Playwright objects;
  - `page.evaluate` in Puppeteer-style code;
  - a Google Analytics `<script>` in a plain React component;
  - `PlatformColor` without `react-native`;
  - `useQuery` from a non-TanStack module.

  Record reach (gate defeated or enforced) and noise outside the framework in a gate table in decision 5. Re-level any rule that defeats its gate and reports outside its framework. Verify that decision 5's gate table has a row for each of the ten.

  **Result:** all ten report identically in all eight directories (`react` alone and with each dependency), so every gate is defeated. Two report outside their frameworks and are re-levelled to balanced `off`:
  - `noPlaywrightNthMethods`, on Cheerio's and Immutable's `.first()` and `.last()`;
  - `useNextScriptForGoogleAnalytics`, on a GA `<script>` in a plain React component.

  The other rules keep `warn`:
  - `noPlaywrightUnsafeReferences` reports Puppeteer's `page.evaluate`, which is accurate;
  - the TanStack rules stay silent on Apollo's `useQuery`;
  - the rest have framework-specific triggers.

  Decision 5's gate table has all ten rows.
- [x] 5.3 Run the Tailwind version test for `useTailwindVariablesShorthand`, with `tailwindcss` 3 and with `tailwindcss` 4 declared. Record whether it reports `bg-[var(--x)]` under v3, and whether `biome check --write` rewrites it.

  If the rule skips v3, set balanced to `warn` and drop its relaxation. Otherwise keep `off` and keep the strict hazard for the changeset. Verify that decision 5 records the outcome.

  **Result:** the rule reports under v3 as under v4. With `tailwindcss` 3.4.17 declared, `biome check --write` rewrote `bg-[var(--brand)]` → `bg-(--brand)` and `hover:bg-red-500/[var(--opacity)]` → `hover:bg-red-500/(--opacity)`. Balanced stays `off`, and the strict hazard goes in the changeset. Decision 5 records the outcome.
- [x] 5.4 Run the cross-file fixtures that the analysis-scope requirement demands:
  - `noMissingScssInterpolation`: `--x: bpx(4px)` after `@use 'fns' as *` stays silent, and `--gap: $gap` reports;
  - `noUnsafeReturn`: returning an imported, concretely typed value stays silent;
  - `noUselessTypeAssertion`: an assertion that changes an imported value's type is not reported.

  Record each result and whether the rule can be told about external names. Verify that decision 5 records all three.

  **Result:**
  - **SCSS:** `bpx(4px)` from `_fns.scss` is silent. `$gap` and `math.div(8px, 2)` are reported.
  - **`noUnsafeReturn`:** silent on imported, concretely typed values and on an unresolvable package's import. It reports the `JSON.parse` control.
  - **`noUselessTypeAssertion`:** silent on a necessary `as string` of an imported union, and on an unresolvable import. It reports its three documented forms, and correctly reports `load()!` on an imported non-nullable return.

  None reports correct code across files, and none has an option for external names. All keep `warn`. Decision 5 has the table, and decision 3 cites it.
- [x] 5.5 Measure `noExcessiveNestedBlocks` on CSS: ordinary four-level nesting with and without the `@layer` wrapper that `useLayeredStyles` demands, and inside `@media`.

  If the wrapper alone pushes ordinary nesting past `max: 4`, give `react-strict` `{ "level": "warn", "options": { "ignoreAtRules": ["layer"] } }` after the category's string-valued entries. Verify that decisions 5 and 6 record the outcome either way.

  **Result:** the rule reports no CSS at all in 2.6.6: four selector levels with and without `@layer`, five selector levels, and five nested at-rules are all silent. The JavaScript control (five nested `if`s) is reported. No option is set, and decisions 5 and 6 record why.
- [x] 5.6 Time `pnpm exec biome lint` over the fixture set with and without `noUnsafeReturn`, `noUselessTypeAssertion`, and `noTanstackQueryVoidQueryFn`. Verify that decision 5 records the measured difference.

  **Result:** the fixture set alone is too small to time, so a 1,600-file synthetic corpus built from the same sources was used. Over nine alternating runs:
  - median wall time: 716 ms with the rules and 711 ms without (+5 ms, 0.8%, within noise);
  - Biome's own figures: 506 ms and 501 ms;
  - the "on" runs carry exactly the 1,200 extra diagnostics the three rules produce.

  Decision 5 records it.
- [x] 5.7 Apply every re-level from 5.1–5.6, then run `pnpm exec biome check --write` and `pnpm sync-stable`.

  Update decision 10's counts and the README:
  - relaxation rows and totals;
  - the nursery note and its spelled-out count;
  - the TanStack Query highlight's statement of the measured gate behaviour.

  Verify that `node scripts/check-presets.ts` passes in full and that decision 10 matches the presets' actual counts.

  **Result:** the two re-levels from 5.2 are applied, and 5.3–5.6 overturned no other level.
  - Balanced now relaxes 43 (28 nursery, 15 stable). Of the 70 additions it lists 60 at `warn`, 1 at `info`, and 9 `off`.
  - `biome check --write` applied no fixes, and `pnpm sync-stable` left both `-stable` files unchanged.
  - The README has ten new nursery rows, `43` in the table, prose, and note, 28 names in the note, and "twenty-eight".
  - The TanStack highlight states the measured gate behaviour. Re-testing it found `noTanstackQueryVoidQueryFn` is not import-keyed, so the wording says "imports and `queryFn` option".
  - A backticked `useQuery` tripped the rule-name matcher and now reads `useQuery()`.
  - `check:presets` passes: 767 classified, 383 listed, 0 unaccounted.
  - Decision 10 matches the presets: 383 / 383 / 228 / 228, nursery 155, snapshot 767, ledger 3. The proposal's and design's relaxation figures now read ten / 43 / 60.

## 6. Behaviour audit, changeset, and integration

- [x] 6.1 Measure the load matrix and record it in design decision 8. Verify that decision 8 records each cell.
  - under `pnpm dlx @biomejs/biome@2.6.5`, `react-strict` and `react-balanced` fail on unknown keys;
  - under 2.6.6 all six presets load;
  - the other four presets under 2.6.2 and 2.6.5: whether they load, and any notice about the `$schema` version.

  **Result:**
  - The parents fail under 2.6.2 (70 unknown keys) and under 2.6.5 (11, the in-scope rules first declared in 2.6.6).
  - All six load under 2.6.6 with no notice.
  - The other four load under 2.6.2 and 2.6.5 (exit 0), with an informational "The configuration schema version does not match the CLI version" notice that fails nothing.

  Decision 8 records each cell.
- [x] 6.2 Close decision 14's two open measurements:
  - a JSON fixture formatted with the presets' formatter under 2.6.2 and 2.6.6 gives identical output (#12649);
  - a CSS fixture with unsorted properties raises no `useSortedProperties` diagnostic under the presets' `assist.actions.preset: "recommended"`.

  Verify that decision 14 records both.

  **Result:**
  - `data.json` and `tsconfig.jsonc` format byte-identically under 2.6.2 and 2.6.6.
  - `useSortedProperties` raises 0 diagnostics under the presets' assist settings, against 1 in a control with the action switched on.

  Decision 14 records both.
- [x] 6.3 Write `.changeset/upgrade-biome-2-6-6.md` as a `minor`, by hand rather than with `pnpm changeset`, which commits. Follow design decision 17. Verify that:
  - `pnpm changeset status` lists a minor release of `@dvashim/biome-config`;
  - the file names the 2.6.6 requirement first;
  - it names every relaxed rule with its ground, and the strict-only caveats;
  - it gives the 90 rules left out and the counts;
  - it cites no Biome pull-request numbers.

  **Result:** `pnpm changeset status` lists `minor` for `@dvashim/biome-config`.
  - The first bullet is the 2.6.6 requirement, with the 2.6.5 overflow and the four presets that still load under older 2.6 releases.
  - All ten relaxations appear with their grounds, followed by the strict-only caveats: the `useTailwindVariablesShorthand` hazard, the `noArrayForEach`/`noForEach` overlap, and `useIteratorZip`.
  - It also covers the 70 additions (exactly 70 names), the SCSS scope, the 90 left out, the counts, and decision 14's inherited changes.
  - It cites 0 Biome PR numbers.
- [x] 6.4 Run the full `pnpm run check` and verify every `check:*` script passes, with `check:presets` printing `767 rules classified, 383 listed, 0 unaccounted` (or decision 10's final listed count). Also verify that `openspec validate upgrade-biome-2-6-6 --strict` passes and `pnpm install --frozen-lockfile` succeeds.

  **Result:** `pnpm run check` exits 0 in 26 s.
  - `check:format`: 41 files, no fixes.
  - `check:rule-metadata`: matches 2.6.6, installed, 767 rules.
  - `check:publint`: "All good!".
  - `check:presets`: `767 rules classified, 383 listed, 0 unaccounted`.
  - `check:sync-stable` and `check:types` pass.

  `openspec validate --strict` reports the change valid, and `pnpm install --frozen-lockfile` reports "Lockfile is up to date".
- [x] 6.5 Review `git diff --stat` and verify that it touches only the files `proposal.md`'s Impact names, plus the untouched unrelated working-tree changes. The `-stable` files must differ from `HEAD` only in `$schema`.

  **Result:** the files this change touched are exactly those `proposal.md`'s Impact names:
  - the six `dist/*.json` and `biome.json`;
  - `audit/rule-metadata.json` and `audit/rule-exclusions.json`;
  - `scripts/check-presets.ts`;
  - `README.md` and `CLAUDE.md`;
  - `.changeset/upgrade-biome-2-6-6.md` and this change's directory;
  - its hunks of `package.json` and `pnpm-lock.yaml`.

  The unrelated working-tree changes listed in 1.1 are the same set and untouched (`scripts/sync-rule-metadata.ts` included). Both `-stable` files differ from `HEAD` only in `$schema`.

  **One constraint for committing:** `CLAUDE.md`'s root-configuration line carries the tooling switch's edit (dropping "immutable ADRs,") and this change's lockfile sentence. Landing the tooling commit first avoids splitting that line by hand.

## Workflow follow-up

- Land the unrelated working-tree changes in their own commits, preferably before this change's commit: the `spec-driven` switch with the ADR and intent removal, and the pnpm 12.18.0 bump.
- Commit this change as `feat: target Biome 2.6.6 and add 70 nursery rules` (adjust the number if re-leveling changed the listed set), and open a PR to `main`.
- After review, archive with `openspec archive upgrade-biome-2-6-6 --yes`, which syncs the MODIFIED scope requirement and the two ADDED settings requirements into `openspec/specs/linter-rule-coverage/spec.md`. Verify with `openspec validate --specs`.
- Start the follow-up change that reviews options on already-listed rules: 77 of the 313 accept options, and 6 set them.
- Delete the empty `openspec/changes/cover-markdown-and-yaml/` stub when convenient.
