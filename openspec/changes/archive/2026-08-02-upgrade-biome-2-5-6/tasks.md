## 1. Advance the pinned Biome target to 2.5.6

- [x] 1.1 Replace the `$schema` URL `https://biomejs.dev/schemas/2.5.5/schema.json` with the 2.5.6 URL in all six `dist/*.json` presets and in the root `biome.json` — 7 occurrences. Verify with `grep -c '2\.5\.5' dist/*.json biome.json` returning 0 for every file.
- [x] 1.2 Bump the `@biomejs/biome` devDependency range in `package.json` from `^2.5.5` to `^2.5.6`.
- [x] 1.3 Run `pnpm install` to refresh the lockfile. `pnpm-lock.yaml` currently records `specifier: ^2.5.5` / `version: 2.5.6`; only the `specifier` line should change, since 2.5.6 is already resolved. CI runs `pnpm ci`, which fails on a stale lockfile, so this step is required — confirm with `git diff --stat pnpm-lock.yaml` showing a 1-line change.

## 2. Add `nursery/noJsRestrictedProperties`

- [x] 2.1 In `dist/biome.react-strict.json`, add `"noJsRestrictedProperties": "warn"` to `linter.rules.nursery`, between `noInlineStyles` and `noJsxLeakedDollar`. No `options` block (design Decision 2).
- [x] 2.2 In `dist/biome.react-balanced.json`, add the identical entry at the same position — same severity, no relaxation (design Decision 3).
- [x] 2.3 Run `biome check --write` to apply the `useSortedKeys` assist and confirm the inserts are already correctly ordered (the diff should show no key movement). Note `pnpm check` runs `biome format` only and will not catch a key-order error.

## 3. Regenerate the `-stable` variants

- [x] 3.1 Run `pnpm sync-stable` to regenerate `dist/biome.react-strict-stable.json` and `dist/biome.react-balanced-stable.json`. Do not hand-edit them, including their `$schema` lines.
- [x] 3.2 Verify each `-stable` diff contains only the `$schema` change — the new rule is nursery and must be stripped — and that both still list 182 rules.

## 4. Update the README

- [x] 4.1 Replace all five `2.5.5` references: the Requirements table row (`**2.5.5+**`), the schema-pin prose below it, the Defaults schema-URL sample, the "built and tested against **Biome 2.5.5**" line, and the `pnpm add -D @biomejs/biome@^2.5.5` command.
- [x] 4.2 Raise the rule totals `254` → `255` in all four places: the "A ladder, not a single opinion" bullet, the React strict and React balanced rows of the preset table, and the React strict section's "**254 optional and nursery rules**".
- [x] 4.3 Raise the nursery count `72` → `73` in all three places: the nursery column of the React strict and React balanced table rows, and the `- **nursery** (72 rules)` category heading.
- [x] 4.4 Add a highlights sub-bullet under the nursery category, after **Dependencies:** — `**Restrictions:** noJsRestrictedProperties` — noting that it reports nothing until the consumer configures `entries`.
- [x] 4.5 Confirm the four `182` references are left unchanged (the `-stable` rule counts do not move) and that the balanced relaxation table needs no new row, since the rule is not relaxed.

## 5. Verify

- [x] 5.1 Run `pnpm run check` — all four of `check:format`, `check:publint`, `check:sync-stable`, `check:types` must pass.
- [x] 5.2 Re-run the per-category count command from `CLAUDE.md` and confirm it reports nursery 73 and TOTAL 255 for `react-strict`; confirm `react-balanced` also totals 255 and both `-stable` files total 182.
- [x] 5.3 Run `grep -rn '2\.5\.5' dist/ biome.json README.md package.json` and confirm no stale references remain (matches in `openspec/changes/archive/` and `CHANGELOG.md` are historical and must be left alone).

## 6. Release

- [x] 6.1 Run `pnpm changeset` and record a **minor** bump naming `noJsRestrictedProperties` and the 2.5.6 target. Minor because a preset rule list changed (design Decision 6). Note the changeset config sets `"commit": true`, so this auto-commits.
