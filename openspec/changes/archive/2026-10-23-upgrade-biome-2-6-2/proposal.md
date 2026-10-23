# Proposal

## Why

The presets target Biome 2.5.15 while 2.6.2 is current, and none of the six loads
under 2.6, so the 27 rules 2.6 adds within the presets' groups reach no team and a
team on the current Biome cannot use the presets at all. This change is the 2.6.2
slice of the shared intent. Intent: `intent.md`; shared intent:
`docs/intents/0001-keep-presets-current.md`.

## What Changes

- **Target Biome 2.6.2.** Advance the `$schema` URL in all six `dist/*.json` presets
  and in `biome.json`, the seven Biome version references in `README.md`, and the
  declared `@biomejs/biome` range in `package.json` (`^2.5.15` → `^2.6.2`) with its
  lockfile specifier. The working tree already holds that range and resolves 2.6.2.
- **BREAKING for teams on Biome 2.5 — every preset now needs Biome 2.6.** Remove
  `javascript.parser.gritMetavariables` from all six presets: 2.6 removed the
  setting and refuses to load any configuration that sets it. Together with the
  relocations and the Markdown setting below, all six presets then load under 2.6
  and none loads under 2.5. The release is still a `minor` under the standing sizing
  rule, and its changeset leads with the requirement.
- **Regenerate the rule catalogue** (`audit/rule-metadata.json`) against 2.6.2 —
  557 → 607 rules. The per-hop audit finds every change in 2.5.15 → 2.6.0: 51 rules
  added, `useSortedClasses` removed, 59 promoted out of `nursery`. 2.6.0 → 2.6.1 →
  2.6.2 change nothing: the schemas are byte-identical and the source between them
  differs only in version fields and changelogs.
- **Carry the 50 promoted rules the presets list.** 48 move to the stable category
  2.6 assigns them, at the level each parent gave them, which brings them into both
  `-stable` presets (180 → 228 rules). `useMathMinMax` and `useDomNodeTextContent`
  become recommended, domain-free, and stable at their default `warn`, so the
  presets drop them: they stay active at `warn` through Biome's recommended set.
- **Rename** `useSortedClasses` to `useTailwindSortedClasses`, at `warn` in both
  parents.
- **Enable the 27 in-scope additions** in `nursery`: `warn` in `react-strict`, and
  `warn` in `react-balanced` except five turned `off` —
  `noExcessiveStatementsPerFunction`, `noTailwindLegacyUtilities`,
  `noTailwindRestyledComponents`, `useLowercaseTestTitle`, and
  `useTailwindStaticClassStrings`. Each level and its evidence live in `design.md`.
- **Leave out the other 23 additions**: 18 serve only Vue or Svelte and are excluded
  by their domains; 5 are Markdown or YAML rules — `noDuplicateMapKeys`,
  `useConsistentHeadingLevel`, `useFencedCodeLanguage`, `useSingleTopLevelHeading`,
  `useTopLevelHeading`.
- **Exclude Markdown and YAML rules from the standing scope**, beside GraphQL, in the
  `linter-rule-coverage` spec and in `scripts/check-presets.ts`. Today the checks can
  only report those five as awaiting classification.
- **Read every example by the fence that opens it.** The sweep reads the inner
  ```` ```js ```` fences of a ```` ````md ```` example as the rule's language, which
  files `useFencedCodeLanguage` as a JavaScript rule and gives
  `useConsistentHeadingLevel` none. Fixed in `scripts/sync-rule-metadata.ts`; no
  other rule's languages change.
- **Record `noEmptySource` as in scope in the exclusion ledger.** 2.6 documents it
  with YAML examples only, so its metadata no longer shows the JavaScript and CSS
  files it still reports.
- **Keep Markdown front matter intact.** Add `"markdown": { "parser":
  { "frontmatter": true } }` to all six presets' shared blocks. Under 2.6's default,
  `biome check --write` — the command the README gives teams — turns a Changesets
  file's front matter into a heading and flattens nested front-matter keys.
- **Record the option audit.** New options on rules the presets activate
  (`noRedundantRoles`, `noTailwindArbitraryValue`, `noUnusedVariables`), the
  `useLogicalProperties` fix setting, and the new `markdown`, `yaml`, `tailwind`,
  plugin, and assist settings keep Biome's defaults; only `markdown.parser.frontmatter`
  is adopted.
- **Keep the repository's own checks running under 2.6.** The root `biome.json`
  keeps Markdown and `pnpm-lock.yaml` out of them — 2.6 would reformat 79 Markdown
  files that are records, generated assets, or the published README, and pnpm's own
  lockfile — and the two workflow files take the YAML formatter's quotes.
- **Reconcile the README**: version references, every count (288 → 313 configured,
  nursery 108 → 85, `-stable` 180 → 228, relaxations 28 → 33 with the stable subset
  still 15), the category highlights the promoted rules move between, the three names
  that leave the presets, the omitted-rules sentence, and the Defaults section.
- **Correct the maintainer statements 2.6 makes untrue** in `CLAUDE.md` and in the
  sweep's own description of fences.
- **Release a `minor`** whose changeset leads with the Biome 2.6 requirement, then
  gives the inherited 2.6 changes by the presets they reach — including the files
  2.6 newly formats and the team settings that stop loading — the promoted, renamed,
  added, relaxed, and omitted rules, and the counts.
- **Audit configuration migrations** by previewing `biome migrate` against every
  preset and `biome.json`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`: **Out-of-scope rules are excluded** also excludes Markdown
  and YAML language rules, derived from their examples like GraphQL's, and states that
  an example is read by the fence that opens it.

## Impact

- `dist/biome.react-strict.json`, `dist/biome.react-balanced.json` — 48 relocations,
  2 removals, 1 rename, 27 additions, the removed parser setting, the Markdown block,
  `$schema`.
- `dist/biome.recommended.json`, `dist/biome.react-recommended.json` — the removed
  parser setting, the Markdown block, `$schema`.
- `dist/biome.react-strict-stable.json`, `dist/biome.react-balanced-stable.json` —
  regenerated by `pnpm sync-stable`.
- `biome.json` — `$schema` and the Markdown and lockfile exclusion.
  `.github/workflows/check.yml`, `release.yml` — quote style only.
- `package.json`, `pnpm-lock.yaml` — the `@biomejs/biome` range and its lockfile
  specifier only; the unrelated working-tree bumps land separately.
- `audit/rule-metadata.json` — regenerated. `audit/rule-exclusions.json` — one entry.
- `scripts/check-presets.ts` — the excluded-language set.
  `scripts/sync-rule-metadata.ts` — fence reading.
- `openspec/specs/linter-rule-coverage/spec.md` — on archive, from the delta.
- `README.md`, `CLAUDE.md`, `.changeset/` — as above.
- Teams: users of `react-strict` receive the 27 additions, users of `react-balanced`
  22 of them. Users of the `-stable` presets receive the 48 promoted rules at `warn`.
  Users of `recommended` and `react-recommended` start running the 12 promoted rules
  Biome recommends for the React, test, Playwright, React Native, and Drizzle domains
  wherever those domains are on, and `useMathMinMax` and `useDomNodeTextContent`
  everywhere. Users of every preset need Biome 2.6; start running the 7 promoted Vue
  and Qwik rules wherever those domains are on, and `noDuplicateFieldDefinitionNames`
  on GraphQL files; and get 2.6's formatting of Markdown, YAML, SCSS, and Apps Script
  files, which 2.5.15 never processed.
