# Proposal

## Why

The presets target Biome 2.6.2 while npm `latest` is 2.6.6. The four releases in
between add 160 nursery rules, 70 of them within the presets' scope, and none
reaches a team until the presets list it. 2.6.5 also misapplies configuration for
any nursery rule past the 256th (biome#12954, fixed in 2.6.6). That is the
release the repository's own lockfile resolves today, and one that every rule
added in 2.6.5 or later would hit, so the next presets must require 2.6.6.

## What Changes

- **Target Biome 2.6.6.** Advance the `$schema` URL in all six `dist/*.json`
  presets and in `biome.json`, the seven Biome version references in `README.md`,
  and the declared `@biomejs/biome` range in `package.json` (`^2.6.2` → `^2.6.6`)
  with its lockfile entries.
- **BREAKING for teams on Biome 2.6.2–2.6.5: `react-strict` and `react-balanced`
  now need Biome 2.6.6 or later.** They list rules that only 2.6.6 declares, so
  they stop loading under any earlier 2.6 release. The other four presets change
  only their `$schema` target. The release is still a `minor` under the standing
  sizing rule, and its changeset leads with the requirement.
- **Regenerate the rule catalogue** (`audit/rule-metadata.json`) against 2.6.6:
  607 → 767 rules. The per-hop audit (2.6.2 → 2.6.3 → 2.6.4 → 2.6.5 → 2.6.6)
  finds 33, 30, 85, and 12 rules added, all to `nursery`, and no rule removed,
  renamed, or promoted in any hop. One existing entry changes: `useLogicalProperties`
  now documents SCSS.
- **Enable the 70 in-scope additions** in `nursery`, all at `warn` in
  `react-strict`. `react-balanced` lists 60 at `warn` and relaxes ten: `off` for
  `noArrayForEach`, `noDanglingUnderscore`, `noNull`, `noPlaywrightNthMethods`,
  `noSyncMethods`, `useIteratorZip`, `useNextScriptForGoogleAnalytics`,
  `usePackageJsonCpu`, and `useTailwindVariablesShorthand`, and `info` for
  `usePackageJsonEngines`. Fixtures run during the change settled every level. The
  gate tests added the Playwright and Next.js rules, which report outside their
  frameworks. `noShortTimeValues` reports nothing until a consumer sets
  its `minimum`, so it is listed as a configuration-required rule.
- **Leave out the other 90**: 84 Vue-only and 5 Svelte-only rules, excluded by
  their domains, and `noYamlBooleanKeys`, excluded by its YAML examples.
- **Bring SCSS into scope.** Biome 2.6 lints and formats `.scss` files for every
  consumer, and these releases publish the first rule documented only in SCSS
  (`noMissingScssInterpolation`). The checker today can neither exclude that rule
  nor accept it once listed. Clause (a) of the standing scope and
  `scripts/check-presets.ts` gain `scss`.
- **Record `useConsistentUnicodeBom` as in scope in the exclusion ledger.** Its only
  examples are Markdown, so its metadata files it as a Markdown rule. It reports a
  leading byte order mark in JavaScript, TypeScript, CSS, JSON, and HTML files
  (measured), as its release note says.
- **Make the new-settings policy a standing requirement.** "Keep Biome's default
  for a new setting outside the rule options unless that default damages files"
  lived in `docs/adr/0002`, which the switch to the `spec-driven` schema retires.
  This pass's audit finds one new setting, the `tanstackQuery` domain, and adopts
  nothing. `markdown.parser.frontmatter: true` stays, because 2.6.6 still defaults
  it to `false`.
- **Record the option audit.** `noTailwindRawColors.allowBlackAndWhite` defaults
  to `true`, which keeps the rule's existing behaviour, so it is not set. Seven
  additions take options, and all seven keep Biome's defaults.
- **Drop `!pnpm-lock.yaml` from the root `biome.json`.** Biome protects pnpm
  lockfiles by itself since 2.6.4.
- **Reconcile the README:**
  - the version references and the Requirements row (`2.6.6+`);
  - every count: 313 → 383 configured, nursery 85 → 155, relaxations 33 → 43 (the
    stable subset is still 15, and the `-stable` presets still list 228);
  - the relaxation rows and the nursery note;
  - the scope sentence, which gains SCSS;
  - highlights for the rule families new to the presets: TanStack Query, SCSS, and
    `package.json` fields.
- **Correct `CLAUDE.md`** where 2.6.6 makes it untrue: the scope line, the
  framework-domain list, the ledger paragraph, and the root-configuration
  paragraph.
- **Release a `minor`.** Its changeset leads with the 2.6.6 requirement, gives the
  additions with their levels and grounds, and lists the behaviour changes these
  releases bring to presets whose rule lists do not move.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`:
  - **In-scope non-recommended rules are explicitly enabled** adds `scss` to the
    languages that qualify a rule, and names `tanstackQuery` among the domains
    clause (a) does not list.
  - A new requirement keeps Biome's default for every new setting outside the rule
    options, unless that default damages files the presets have Biome process.

## Impact

- `dist/biome.react-strict.json`, `dist/biome.react-balanced.json`: 70 additions
  and the `$schema` target.
- `dist/biome.recommended.json`, `dist/biome.react-recommended.json`: `$schema`.
- `dist/biome.react-strict-stable.json`, `dist/biome.react-balanced-stable.json`:
  regenerated by `pnpm sync-stable`, which changes only `$schema`.
- `biome.json`: `$schema` and the lockfile exclusion.
- `package.json`, `pnpm-lock.yaml`: the `@biomejs/biome` range and its lockfile
  entries only. The other working-tree changes land separately.
- `audit/rule-metadata.json`: regenerated. `audit/rule-exclusions.json`: one entry.
- `scripts/check-presets.ts`: `IN_SCOPE_LANGUAGES` and its comments.
- `openspec/specs/linter-rule-coverage/spec.md`: updated from the delta on
  archive.
- `README.md`, `CLAUDE.md`, `.changeset/`: as above.
- **Teams on `react-strict`** receive 70 rules, including double reports where
  `noArrayForEach` overlaps the listed `noForEach`.
- **Teams on `react-balanced`** receive 60 at `warn` and 1 at `info`.
- **Teams on every preset** inherit the 2.6.3–2.6.6 changes to listed and
  recommended rules, and to the formatter's TypeScript, Markdown, and SCSS output.
  Biome also stops processing `pnpm-lock.yaml`.
