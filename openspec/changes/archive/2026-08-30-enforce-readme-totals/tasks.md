## 1. Teach the check to read published totals

Written first, deliberately: each task below should leave `check:presets` **red**
against the current README. A check that is green the moment it is written has
not been shown to catch anything.

- [x] 1.1 Parse the Configurations table in `scripts/check-presets.ts` section 6 — locate the header row, map the `Explicit rules` and `Nursery` columns by name, and identify each row's preset from the `extends` path in its cells. Verify `pnpm run check:presets` now fails naming the four stale rows (`react-strict` 264/262, `react-strict-stable` 182/180, `react-balanced` 264/262, `react-balanced-stable` 182/180).
- [x] 1.2 Add a matcher for the ladder bullet (`up to N explicitly configured rules`) comparing against `react-strict`'s total. Verify `pnpm run check:presets` additionally names the intro bullet's 264.
- [x] 1.3 Add table-row coverage: one row per preset published from `dist/`, and no row for a preset that is not published. Verify by temporarily deleting the `react-balanced` row — the check fails naming that preset — then restoring it.
- [x] 1.4 Make every count matcher added above mandatory, reporting `README has no <what> to check` on a miss, matching the existing `checkPhrase` behaviour. Verify by temporarily retitling the `Explicit rules` column — the check fails reporting a missing column rather than passing silently — then restoring it.

## 2. Correct the published counts

- [x] 2.1 Update the five stale README numbers: `README.md:25` 264 -> 262; `:77` 264 -> 262; `:78` 182 -> 180; `:79` 264 -> 262; `:80` 182 -> 180. Leave 82, 18 and 15 alone — those are current. Verify `pnpm run check:presets` passes.
- [x] 2.2 Verify the whole suite is green and nothing else moved: `pnpm run check` passes, and `git diff --stat` shows no `dist/*.json` change (so `sync-stable` and the rule-metadata snapshot stay untouched).

## 3. Stop duplicating the totals internally

- [x] 3.1 Remove the three counts from `CLAUDE.md:50-52` (264, 264, 182), replacing them with a pointer to the README's Configurations table as the published source. Keep the per-category framing and the nursery/relaxation facts that are not totals. Verify `grep -nE '\b(26[0-9]|18[0-9])\b' CLAUDE.md` returns no line claiming a preset total.

## 4. Release and close out

- [x] 4.1 Create a `patch` changeset naming the corrected counts and the new invariant. Verify `.changeset/*.md` contains exactly one new file at `patch`, per the release-sizing requirement's documentation-only case.
- [x] 4.2 Verify the change validates end to end: `openspec validate enforce-readme-totals --strict` passes and `pnpm run check` is green.

## 5. Hand off to the Biome 2.5.11 pass

- [x] 5.1 Confirm the sequencing guard actually holds: with this change landed, verify that bumping `react-strict` by one rule (any scratch edit, reverted afterwards) makes `check:presets` fail on the published totals — the property the 2.5.11 pass depends on. Do not land the scratch edit.
