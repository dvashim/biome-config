# Tasks: upgrade-biome-2-5-4

## 1. Re-verify upstream state

- [x] 1.1 Confirm `@biomejs/biome` npm `latest` is still `2.5.4` (`npm view @biomejs/biome dist-tags`); if a newer stable exists, rescope the bump to it and redo the 2.5.4→newer rule audit before continuing (design Decision 1 / Risks)
- [x] 1.2 Confirm the working tree is mid-upgrade as expected: `./node_modules/.bin/biome --version` reports `2.5.4` and `package.json` has `@biomejs/biome` at `^2.5.4`

## 2. Bump the Biome target 2.5.3 → 2.5.4

- [x] 2.1 Update the `$schema` URL from `.../schemas/2.5.3/...` to `.../schemas/2.5.4/...` in all six `dist/*.json` presets and in the root `biome.json` (seven files)
- [x] 2.2 Update every `2.5.3` reference in `README.md`: the Requirements line, the Defaults → Schema URL, and the three FAQ mentions (version-support paragraph, the `pnpm add -D @biomejs/biome@^2.5.4` command, and the "pin it to `.../schemas/2.5.4/schema.json`" note)
- [x] 2.3 Confirm the pending `@biomejs/biome` `^2.5.4` devDependency bump (already in the working tree) is staged to land with this change

## 3. Confirm the rule audit — no preset changes

- [x] 3.1 Re-confirm against the 2.5.4 release notes that it adds no in-scope lint rule and renames/graduates/removes none (rule-adjacent items only fix/enhance already-covered rules: `noLabelWithoutControl`, `noCommentText`, `useSortedClasses`); make **no** edits to `dist/biome.react-strict.json` or `dist/biome.react-balanced.json`
- [x] 3.2 Run `pnpm sync-stable` and confirm it produces **no** diff to the `-stable` variants (an unexpected diff means a hidden rule change — re-open the audit rather than committing the regenerated files)

## 4. Validate

- [x] 4.1 Run `biome check --write` and confirm the edited files reformat to no-ops (the `$schema` is line 2, so key order is unaffected)
- [x] 4.2 Run `pnpm check` and confirm formatting, exports, `-stable` sync, and types all pass with no drift
- [x] 4.3 Confirm no stale `2.5.3` remains in the live published/config files: `grep -n "2\.5\.3" dist/*.json biome.json README.md` returns nothing (do **not** touch `CHANGELOG.md`, archived `openspec/changes/`, or the historical `.claude/settings.local.json` permission entries)

## 5. Land the change

- [x] 5.1 Create a `patch` changeset (`pnpm changeset`) describing the 2.5.4 target bump; confirm it auto-commits (changeset config has `"commit": true`)
- [x] 5.2 Commit the `$schema`/README/`package.json` edits, the ride-along dev bumps (`@changesets/cli`, `validate-package-exports`), and the OpenSpec change artifacts together on the `up` branch
