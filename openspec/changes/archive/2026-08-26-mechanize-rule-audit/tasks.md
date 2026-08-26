## 1. Rule-metadata sweep and snapshot

- [x] 1.1 Add `scripts/sync-rule-metadata.ts` following the `sync-stable.ts` conventions (TypeScript run by Node native type stripping, no new runtime dependency); verify `pnpm run check:types` passes with it present
- [x] 1.2 Read the rule set and categories from the target release's `configuration_schema.json`, and each rule's recommended status, domains, default severity, diagnostic category, and example languages by invoking `biome explain` directly at `node_modules/@biomejs/biome/bin/biome` (not through `pnpm exec`, which costs ~500ms per call against ~65ms direct), fanned out in parallel; verify a full sweep completes in under 30s
- [x] 1.3 Assert the sweep parsed metadata for **100%** of the rules the schema declares and fail otherwise (design.md — Decision 4); verify by running the sweep against a deliberately truncated `explain` output and confirming it fails rather than emitting a partial snapshot
- [x] 1.4 Write the snapshot to a committed file that records the Biome version it describes; verify re-running the sweep with no input change produces a byte-identical file
- [x] 1.5 Add a `--check` mode that compares instead of writing and exits 1 on drift, mirroring `sync-stable.ts --check`; verify it exits 0 against a fresh snapshot and 1 after a hand edit
- [x] 1.6 Generate the bootstrap snapshot at **2.5.9** — the version the presets currently pin, not the installed 2.5.10 — using `pnpm dlx @biomejs/biome@2.5.9` for the sweep; verify the snapshot records 522 rules and names 2.5.9

## 2. Exclusion ledger

- [x] 2.1 Add a committed ledger file mapping rule name to the reason the metadata cannot classify it; verify the file parses and every entry carries a non-empty reason
- [x] 2.2 Leave the ledger **empty** — derivation classifies every rule in 2.5.9, so a seeded entry would be a rule the coverage check already accounts for. Verify the check in 3.1 reports zero rules awaiting classification against an empty ledger, and that adding a redundant entry is reported rather than silently accepted

## 3. Checks over the snapshot

Each check reads only the snapshot, the presets, the ledger, and `README.md` — never the network and never the Biome binary (design.md — Non-Goals, Decision 1). Each is expected to pass against the presets as they stand today.

- [x] 3.1 **Coverage** — every rule in the snapshot is listed in `react-strict`, recommended-with-no-domain, framework-domain-only, excluded-language-only, or in the ledger; failure names the unclassified rules. Verify it reports zero today, and fails naming the rule when a rule is made unclassifiable
- [x] 3.2 **Category placement** — every listed rule sits in the category the snapshot reports; verify zero drift today, and failure after moving one rule between categories in a preset
- [x] 3.3 **Rule existence** — every listed rule exists in the snapshot; verify zero today, and failure after adding a nonexistent rule name to a preset
- [x] 3.4 **Redundancy** — no listed rule is recommended, domain-free, outside `nursery`, and at its default severity with no options. Verify it reports zero today **and** that it does not flag `useMathMinMax`, which is nursery, reported recommended, and listed at its default `warn` (spec — *Nursery rule reported as recommended is not redundant*)
- [x] 3.5 **Preset parity** — `react-strict` and `react-balanced` list identical rule sets; verify it reports zero today (both list 264) and fails after deleting one rule from `react-balanced`
- [x] 3.6 **README inventory** — per-category counts equal `react-strict`'s, every rule the README names exists in that preset, and the relaxation table's totals reconcile (18 overall, 15 reaching `react-balanced-stable`). Verify it passes today and fails after changing one count
- [x] 3.7 **Pinned-target consistency** — the snapshot's version, the `$schema` URL in all six `dist/*.json` presets and in `biome.json`, and every Biome version reference in `README.md` name the same release. Verify it flags all **seven** README occurrences by changing one of them, then confirm it passes at 2.5.9 across all files

## 4. Wiring

- [x] 4.1 Add the checks as `check:*` entries in `package.json` so the existing `pnpm run "/^check:.*/"` fan-out picks them up; verify `pnpm run check` runs them and still passes
- [x] 4.2 Add the snapshot regeneration command alongside `sync-stable`; verify `pnpm run check` fails after a hand edit to the snapshot and passes again after regenerating
- [x] 4.3 Confirm CI needs no workflow edit because the fan-out is already what CI runs; verify by inspecting `.github/workflows/` and recording that no change was needed

## 5. Documentation reconciliation

- [x] 5.1 Correct `CLAUDE.md`, which states the repo has "no build step and no test suite" and that "the only executable code is `scripts/sync-stable.ts`" — both falsified by this change; verify no other line in `CLAUDE.md` still describes the audit as entirely manual
- [x] 5.2 Document the new commands in `CLAUDE.md` alongside the existing `check:*` entries, including that the per-category rule-count one-liner is now superseded by check 3.6; verify each documented command runs as written

## 6. Whole-change verification

- [x] 6.1 Confirm every `dist/*.json` file is byte-identical to its state before this change; verify with `git diff --stat dist/` reporting no changes
- [x] 6.2 Confirm no changeset is created — the published surface is untouched, which is the dev-only case of the `Version-tracking passes release according to their published impact` requirement; verify `.changeset/` gained no entry
- [x] 6.3 Run `pnpm run check` end to end and confirm all checks pass, including the pre-existing `check:format`, `check:publint`, `check:sync-stable`, and `check:types`
- [x] 6.4 Run `openspec validate mechanize-rule-audit` and confirm the change is valid before archiving
