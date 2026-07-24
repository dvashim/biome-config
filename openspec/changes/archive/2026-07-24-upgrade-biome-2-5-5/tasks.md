# Tasks: upgrade-biome-2-5-5

## 1. Re-verify upstream state

- [x] 1.1 Confirm `@biomejs/biome` npm `latest` is still `2.5.5` (`npm view @biomejs/biome dist-tags`); if a newer stable exists, rescope the bump to it and redo the schema rule diff for the wider delta before continuing (design Decision 1 / Risks)
- [x] 1.2 Re-run the rule audit against the target version: diff the rule-name keys per category between `node_modules/@biomejs/biome/configuration_schema.json` (2.5.4) and `https://biomejs.dev/schemas/<target>/schema.json`, and confirm the only difference is `nursery.noNegationInEqualityCheck` added (517 → 518, nothing renamed, graduated, or removed)

## 2. Bump the Biome target 2.5.4 → 2.5.5

- [x] 2.1 Bump the devDependency: `pnpm add -D @biomejs/biome@^2.5.5`, then confirm `./node_modules/.bin/biome --version` reports `2.5.5` and the lockfile updated
- [x] 2.2 Update the `$schema` URL from `.../schemas/2.5.4/...` to `.../schemas/2.5.5/...` in all six `dist/*.json` presets and in the root `biome.json` (seven files; the two `-stable` files are also regenerated in task 3.2, which converges to the same value)

## 3. Add `noNegationInEqualityCheck` to the presets

- [x] 3.1 Add `"noNegationInEqualityCheck": "warn"` to the `nursery` block of `dist/biome.react-strict.json` and `dist/biome.react-balanced.json`, in sorted position between `noMisusedPromises` and `noPlaywrightElementHandle` (design Decisions 3–4); make no other rule-list edits
- [x] 3.2 Run `pnpm sync-stable` and confirm the regenerated `-stable` files differ only in the `$schema` line — the nursery addition is stripped, so both keep 182 rules (an unexpected rule diff means a hidden reclassification: re-open the audit rather than committing)
- [x] 3.3 Verify the counts: `react-strict` and `react-balanced` each list 254 rules with 72 in `nursery`; `react-strict-stable` and `react-balanced-stable` each list 182

## 4. Update documentation

- [x] 4.1 Update every `2.5.4` reference in `README.md` to `2.5.5`: the Requirements line (~51), the Defaults → Schema URL (~88), and the three FAQ mentions (~269, the `pnpm add -D @biomejs/biome@^2.5.5` command ~272, and the "pin it to `.../schemas/2.5.5/schema.json`" note ~275)
- [x] 4.2 Update the React strict **nursery** bullet in `README.md` (~190) from `(71 rules)` to `(72 rules)` and add `noNegationInEqualityCheck` to the highlights list with a one-line description (e.g. a new `**Equality:**` bullet noting it flags `!foo === bar`, which parses as `(!foo) === bar`)

## 5. Validate

- [x] 5.1 Run `biome check --write` and confirm the new rule lands in sorted key order and the edited files are otherwise unchanged
- [x] 5.2 Run `pnpm check` and confirm formatting, `publint`, `-stable` sync, and types all pass; if Biome 2.5.5's formatter changes reformat any repo file, commit that output with the bump (design Risks)
- [x] 5.3 Confirm no stale `2.5.4` remains in the live published/config files: `grep -n "2\.5\.4" dist/*.json biome.json README.md package.json` returns nothing (do **not** touch `CHANGELOG.md`, archived `openspec/changes/`, or historical `.claude/settings.local.json` entries)

## 6. Land the change

- [x] 6.1 Create a `minor` changeset (`pnpm changeset`) covering the 2.5.5 target bump and the `noNegationInEqualityCheck` addition; confirm it auto-commits (changeset config has `"commit": true`) — written directly as `.changeset/spotty-mice-repeat.md` because `changeset add` is interactive-only; `pnpm changeset status` confirms the `minor` bump and the file lands in the 6.2 commit
- [x] 6.2 Commit the preset, `biome.json`, README, `package.json`/lockfile edits together with the OpenSpec change artifacts on the `up` branch
