# Tasks

Scratch copies below mean a detached worktree outside the repository:
`git worktree add --detach <dir> HEAD`, then `pnpm install --offline --frozen-lockfile`
inside it. Remove each one with `git worktree remove --force <dir>` when done. Do
not symlink `node_modules` into a copy: `pnpm exec`, which `sync-stable` and
serialization use, refuses a symlinked hoist directory.

## 1. Coverage: one predicate for what the recommended set activates

- [x] 1.1 In `scripts/check-presets.ts`, add one helper that is true only for a
  rule that is recommended, domain-free, and not in `nursery`. Use it for the
  Coverage exemption, which is today `meta.recommended && meta.domains.length === 0`,
  and in place of Redundancy's separate nursery, recommended, and domain tests.
  Verify that `pnpm run check:presets` on the repository still prints
  `546 rules classified, 280 listed, 0 unaccounted`, with no Redundancy finding for
  any of the 11 listed nursery rules Biome reports as recommended, and that
  `pnpm run check:types` passes.
- [x] 1.2 Replay the 2.5.14 pass in a scratch copy. Remove `noJsonUnsafeValues`,
  `noObsoleteTags`, `noReturnInFinally`, `useConsistentFunctionStyle`,
  `useConsistentObjectKeys`, and `useValidTestTitle` from `react-strict` and
  `react-balanced`, then run `node scripts/check-presets.ts`. Verify that coverage
  names all **six** as awaiting classification. Before 1.1 it named three.
- [x] 1.3 In a scratch copy, add a synthetic unlisted rule to
  `audit/rule-metadata.json`: `category: "nursery"`, `recommended: true`,
  `domains: []`, `languages: ["js"]`, `defaultSeverity: "error"`. Run
  `node scripts/check-presets.ts` and verify it fails naming the rule as awaiting
  classification. Before 1.1 it passed with
  `547 rules classified, 280 listed, 0 unaccounted`.
- [x] 1.4 Rewrite the `CLAUDE.md` bullet in the `audit/` section that says
  "`biome explain` reports nursery rules as 'recommended'". It must say that the
  guard applies to Coverage as well as Redundancy, and name the three 2.5.14
  rules Coverage would have let go unlisted. Verify with
  `grep -n "reports nursery rules" CLAUDE.md` that no sentence still limits the
  guard to redundancy.

## 2. Sweep: every category the release's schema declares

- [x] 2.1 In `scripts/sync-rule-metadata.ts`, replace the `CATEGORIES` list:
  - Read the categories from the keys of `$defs.Rules.properties`, minus
    `NON_RULE_KEYS`.
  - For each category, follow its `$ref`s through `anyOf` and `oneOf` to the
    definitions that carry `properties`, and collect the rule names there, minus
    `NON_RULE_KEYS`.
  - Fail, naming the key, when a category yields zero rules.

  Verify that `pnpm sync-rule-metadata` reports 546 rules and that
  `git diff --exit-code audit/rule-metadata.json` passes, meaning the snapshot is
  byte-identical, and that `pnpm run check:types` passes.
- [x] 2.2 Test the new-category path in a scratch copy. Write a doctored copy of
  `node_modules/@biomejs/biome/configuration_schema.json` to a new file, then `mv`
  it over the original. Never edit that file in place, because pnpm may hard-link
  it from the shared store. The doctored copy declares one extra
  `$defs.Rules.properties` entry, whose group definition holds `useMathMinMax`
  moved out of `$defs.Nursery`. Run `node scripts/sync-rule-metadata.ts` and
  verify the regenerated snapshot still has 546 rules and still contains
  `useMathMinMax`.
- [x] 2.3 In the same scratch copy, add a `$defs.Rules.properties` entry that
  resolves to no rule group, e.g. `{ "type": "boolean" }`. Verify that
  `node scripts/sync-rule-metadata.ts` and
  `node scripts/sync-rule-metadata.ts --check` both exit 1 and name that key.

## 3. Snapshot verified against the pinned release (ADR 0001)

- [x] 3.1 In `scripts/sync-rule-metadata.ts`, resolve the binary for both modes in
  this order:
  1. `--biome`, which fails unless the version it reports is the pinned target;
  2. the installed binary, when its version is the pinned target;
  3. `pnpm dlx @biomejs/biome@<target>`.

  When nothing can be obtained, fail with
  `could not obtain Biome <target> to verify audit/rule-metadata.json` followed by
  the underlying error. Remove the `skipped:` branch and the write-mode refusal.
  Report which binary was used, e.g.
  `matches Biome 2.5.14 (installed) — 546 rules`. Verify that
  `npm_config_registry=http://127.0.0.1:9 pnpm run check:rule-metadata` on the
  repository still prints the `(installed)` match, so the path where the versions
  agree needs no network, and that `pnpm run check:types` passes.
- [x] 3.2 Serialize with the resolved binary: `serialize` and `biomeCheckWrite` run
  the resolved command instead of `pnpm exec biome`. Verify two things:
  `pnpm sync-rule-metadata` still leaves `audit/rule-metadata.json` byte-identical,
  and `node scripts/sync-rule-metadata.ts --check --biome "pnpm dlx @biomejs/biome@2.5.14"`
  reports a match.
- [x] 3.3 Test the split state with the installed binary ahead. In a scratch copy,
  pin an older release everywhere the target is named: the six `$schema` URLs,
  `biome.json`, and the README references. Use one this machine has not fetched
  before, e.g. `2.5.12`, so the cold-cache path runs. Then run
  `node scripts/sync-rule-metadata.ts` and
  `node scripts/sync-rule-metadata.ts --check`, with 2.5.14 installed. Verify that
  the write mode records `biomeVersion` `2.5.12` rather than refusing, and that
  the check reports `matches Biome 2.5.12 (fetched)` and exits 0 rather than
  printing `skipped`.
- [x] 3.4 Test a relabelled snapshot. In a fresh scratch copy, relabel every pinned
  file, the README references, and the snapshot's `biomeVersion` to `2.5.13`
  without regenerating. Verify that `node scripts/sync-rule-metadata.ts --check`
  exits 1 reporting drift against Biome 2.5.13; before 3.1 it printed `skipped`
  and passed. Repeat with the unpublished `2.5.99` and verify it exits 1 with
  `could not obtain Biome 2.5.99`.
- [x] 3.5 Update `CLAUDE.md` in three places:
  - **Commands list**: drop the `--biome` parenthetical from `pnpm sync-rule-metadata`.
  - **`audit/` section**: rewrite the paragraph that ends "`--check` **skips**
    rather than failing when the two differ". It must say the snapshot is verified
    against the pinned target on every run, with that release fetched when it is
    not the one installed. It must also say this then needs network access to the
    npm registry and biomejs.dev, and cost about 24 s against 11 s.
  - **Biome version upgrades convention**: remove "once the `$schema` target and
    the installed binary agree" from the regeneration step.

  Verify with `grep -nE 'skips|refuses|once the .\$schema. target' CLAUDE.md`
  that no statement of the old behavior remains.

## 4. Integration

- [x] 4.1 Run `pnpm run check` on the repository and verify it passes, with
  `check:rule-metadata` reporting the `(installed)` match at 2.5.14 and
  `check:presets` reporting `546 rules classified, 280 listed, 0 unaccounted`.
  Also verify that `pnpm exec biome check` reports no fixes and no diagnostics.
- [x] 4.2 Verify that nothing published moved, so no changeset is created. Check
  that `git diff --name-only main -- dist README.md audit` is empty and that no
  file was added under `.changeset/` besides `config.json`.
- [x] 4.3 Verify that `node .claude/hooks/intent-gate.mjs --check` passes for this
  change, and that `openspec validate close-coverage-gaps --type change --strict`
  reports the change as valid.
