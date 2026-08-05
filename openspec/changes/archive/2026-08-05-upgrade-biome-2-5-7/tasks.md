## 1. Advance the pinned Biome target to 2.5.7

- [x] 1.1 Replace the `$schema` URL `https://biomejs.dev/schemas/2.5.6/schema.json` with the 2.5.7 URL in all six `dist/*.json` presets and in the root `biome.json` — 7 occurrences. Verify with `grep -c '2\.5\.6' dist/*.json biome.json` returning 0 for every file.
- [x] 1.2 Confirm the dependency half is already done in the working tree: `package.json` declares `"@biomejs/biome": "^2.5.7"` and `pnpm-lock.yaml` records `specifier: ^2.5.7` / `version: 2.5.7`. No edit if so — this change adopts the in-flight bump rather than redoing it.

## 2. Add the three new nursery rules

- [x] 2.1 In `dist/biome.react-strict.json` → `linter.rules.nursery`, add `"noExtendNative": "warn"` between `noExcessiveSelectorClasses` and `noFloatingPromises`.
- [x] 2.2 In the same block, add `"noNonScalableViewport": "warn"` between `noNegationInEqualityCheck` and `noPlaywrightElementHandle` (design Decision 2 — `warn`, not Biome's `error` default).
- [x] 2.3 In the same block, add `"noTailwindArbitraryValue": "warn"` between `noRestrictedDependencies` and `noTopLevelLiterals`.
- [x] 2.4 In `dist/biome.react-balanced.json` → `linter.rules.nursery`, add the same three entries at the same positions, but with `"noTailwindArbitraryValue": "off"` (design Decision 3). All three stay bare strings, so the positions match strict exactly.
- [x] 2.5 Confirm `useNullishCoalescing` remains a bare `"warn"` in both presets — the new `ignoreIfStatements` option is audited and deliberately not set (design Decision 5).
- [x] 2.6 Run `biome check --write` to apply the `useSortedKeys` assist and confirm the inserts are already correctly ordered (the diff should show no key movement). Note `pnpm check` runs `biome format` only and will not catch a key-order error.

## 3. Regenerate the `-stable` variants

- [x] 3.1 Run `pnpm sync-stable` to regenerate `dist/biome.react-strict-stable.json` and `dist/biome.react-balanced-stable.json`. Do not hand-edit them, including their `$schema` lines.
- [x] 3.2 Verify each `-stable` diff contains only the `$schema` change — all three additions and the balanced relaxation are nursery and must be stripped — and that both still list 182 rules.

## 4. Update the README

- [x] 4.1 Replace all five `2.5.6` references: the Requirements table row (`**2.5.6+**`), the schema-pin prose below it, the Defaults schema-URL sample, the "built and tested against **Biome 2.5.6**" line, and the `pnpm add -D @biomejs/biome@^2.5.6` command.
- [x] 4.2 Raise the rule totals `255` → `258` in all four places: the "A ladder, not a single opinion" bullet, the React strict and React balanced rows of the preset table, and the React strict section's "**255 optional and nursery rules**".
- [x] 4.3 Raise the nursery count `73` → `76` in all three places: the nursery column of the React strict and React balanced table rows, and the `- **nursery** (73 rules)` category heading.
- [x] 4.4 Add the three rules to the nursery highlights: append `noExtendNative` to the **Object/class hygiene:** bullet, append `noTailwindArbitraryValue` to the **Tailwind:** bullet (noting balanced turns it off), and add an **Accessibility:** bullet for `noNonScalableViewport` immediately before **Security:**.
- [x] 4.5 Update the balanced relaxation inventory: change "**15 targeted relaxations**" to 16, add a table row `| nursery | noTailwindArbitraryValue | warn | off | Arbitrary values are a deliberate Tailwind escape hatch |`, and change the balanced preset-table row to `258, 16 relaxed`.
- [x] 4.6 Rewrite the two statements that assume every relaxation reaches `-stable`: the note under the table ("Every relaxation lives in a stable category, so all 15 apply in `react-balanced-stable` as well") and the React balanced-stable section ("with all relaxations from the table above still applied") — both must now say 15 of the 16 relaxations are stable-category and carry into `react-balanced-stable`, while the nursery one does not.
- [x] 4.7 Confirm the literals that must **not** move are unchanged: both `182` totals and the React balanced-stable row's `15 relaxed`.

## 5. Refresh dev tooling

- [x] 5.1 Run `corepack use pnpm@11.20.0` to advance the `packageManager` pin from `pnpm@11.18.0`; confirm the field reads `pnpm@11.20.0+sha512.9a6f330a95b66446ea088faf1521405a8a01f07fde7124cc9958dfed52d4bb436737e65b08f85f37b46fcba375092558ac51262b816844b22f63406ed166bfee`.
- [x] 5.2 Run `pnpm install` and confirm the resulting `pnpm-lock.yaml` diff carries nothing beyond the already-present `@biomejs/biome` / `@types/node` / `publint` moves. Observed: `pnpm install` wrote nothing ("Already up to date"); the working tree also arrived carrying dev-only transitive moves from the same in-flight dependency pass — `js-yaml` 3.15.0 → 3.15.1 and 4.3.0 → 4.3.1, `tinyexec` 1.2.4 → 1.3.0 — which are kept and covered by `pnpm check`.
- [x] 5.3 Record the currency audit for the rest of the toolchain — `@types/node@26.1.2`, `publint@0.3.23`, `typescript@7.0.2`, `@changesets/cli@2.31.1`, `@changesets/changelog-github@0.7.0` all equal npm `latest`; no edit.
- [x] 5.4 Confirm the OpenSpec CLI is current (`openspec --version` = 1.7.0 = npm `latest` for `@fission-ai/openspec`) and that each `.claude/skills/openspec-*/SKILL.md` still carries `generatedBy: "1.7.0"` — no regeneration in this change.

## 6. Verify

- [x] 6.1 Run `pnpm run check` — all four of `check:format`, `check:publint`, `check:sync-stable`, `check:types` must pass.
- [x] 6.2 Re-run the per-category count command from `CLAUDE.md` and confirm it reports nursery 76 and TOTAL 258 for `react-strict`; confirm `react-balanced` also totals 258 and both `-stable` files total 182.
- [x] 6.3 Run `grep -rn '2\.5\.6' dist/ biome.json README.md package.json` and confirm no stale references remain (matches in `openspec/changes/archive/` and `CHANGELOG.md` are historical and must be left alone).
- [x] 6.4 Diff the two parents' nursery blocks and confirm they now differ in exactly one key — `noTailwindArbitraryValue` (`warn` in strict, `off` in balanced) — and that the two `-stable` files differ from each other only by the 15 stable relaxations, as before.

## 7. Release

- [x] 7.1 Run `pnpm changeset` and record a **minor** bump naming `noExtendNative`, `noNonScalableViewport`, and `noTailwindArbitraryValue` (off in balanced), the 2.5.7 target, and the inherited `useNullishCoalescing` `if`-statement behavior change so consumers can attribute the new diagnostics. Minor because preset rule lists changed (design Decision 7). Note the changeset config sets `"commit": true`, so this auto-commits.
