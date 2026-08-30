## 1. Reproduce the defect first

- [x] 1.1 Reproduce the crash on the current code: add a seventh export to `package.json` pointing at a copy of `dist/biome.recommended.json`, add a matching row to the README Configurations table, and confirm `pnpm run check:presets` exits with `TypeError: Cannot read properties of undefined (reading 'linter')` at `scripts/check-presets.ts:479`. Keep the fixture — task 2.3 reuses it. Do not commit it.

## 2. Make the preset list have one source

- [x] 2.1 Derive `SCHEMA_PINNED` in `scripts/check-presets.ts` from the `dist/*.json` targets of `package.json`'s `exports` map (deduplicated, order-stable) plus the root `biome.json`, replacing the hand-written array. Verify `pnpm run check:presets` still reports `522 rules classified, 262 listed, 0 unaccounted` — the same seven files, the same eight invariants.
- [x] 2.2 Replace the `as Preset` cast at the README row lookup with an `undefined` branch that pushes a named problem and continues. Verify `tsc --noEmit` passes without the cast, which confirms the branch is what satisfies the type rather than a second suppression.
- [x] 2.3 Re-run the task 1.1 fixture. Verify `check:presets` now reports the seventh preset as a problem and exits 1 with a message — no stack trace — and that problems from other invariants in the same run are still reported alongside it. Then remove the fixture and confirm `git status` is clean.

## 3. Guard the hand-written preset names

- [x] 3.1 Verify each of `STRICT`, `BALANCED`, `STRICT_STABLE`, `BALANCED_STABLE` against the derived set, failing with the offending constant named. Verify by temporarily renaming one preset's export target — the check fails naming that path rather than crashing or passing — then restoring it.

## 4. Close out

- [x] 4.1 Confirm no changeset is needed: `git diff --stat` shows no `dist/*.json` and no `README.md` change, which the release-sizing requirement names as the no-changeset case.
- [x] 4.2 Verify end to end: `openspec validate reconcile-preset-lists --strict` passes and `pnpm run check` is green.
