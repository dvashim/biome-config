# Proposal: upgrade-biome-2-5-5

> Scope note: "update the current version of Biome and add new rules to the
> configs" is read against today's upstream state — npm `latest` for
> `@biomejs/biome` is **2.5.5** (published 2026-07-21), while the presets pin
> **2.5.4**. This is the `linter-rule-coverage` "Newer release available"
> scenario. The 2.5.5 rule audit is part of the work, and its result (**one** new
> in-scope rule) is recorded below rather than assumed.

## Why

The presets carry a standing obligation to target the latest stable Biome
release and to explicitly enable every in-scope non-recommended rule
(`linter-rule-coverage`). Biome shipped **2.5.5** on 2026-07-21; the presets
still pin and document **2.5.4**, so the published `$schema` URLs and the README
are one patch behind, and the one lint rule 2.5.5 added is missing from the
explicit opt-in lists.

## What Changes

- **Bump the target Biome version 2.5.4 → 2.5.5** by updating the `$schema` URL
  in all six `dist/*.json` presets and in the root `biome.json` (seven files),
  and by bumping the `@biomejs/biome` devDependency `^2.5.4` → `^2.5.5` (plus
  lockfile).
- **Add one rule — `nursery/noNegationInEqualityCheck`** to `react-strict` and
  `react-balanced` at `warn`. It flags a negated operand on the left of a strict
  equality check (`!foo === bar`), which operator precedence evaluates as
  `(!foo) === bar` — almost always a mistake for `foo !== bar`. It is a
  bug-catching rule with a narrow trigger, so `react-balanced` keeps it at `warn`
  rather than relaxing it. Nursery, JS/TS — in scope because `recommended: true`
  never activates nursery rules.
- **Rule audit against 2.5.5 — one addition, nothing else.** A rule-name diff of
  the 2.5.4 and 2.5.5 JSON schemas (517 → 518 rules) shows `noNegationInEqualityCheck`
  added under `nursery` and **no** rule renamed, graduated out of nursery, or
  removed. Every other 2.5.5 change is a bug fix, perf, or formatter fix to rules
  the presets already cover (`useExhaustiveSwitchCases`, `noBaseToString`,
  `noMisusedPromises`, `noUnresolvedImports`, `noThenProperty`, `useIncludes`,
  `useArrayFind`, `useNullishCoalescing`, `useAwaitThenable`,
  `noUnnecessaryConditions`, `useAriaPropsSupportedByRole`, `useSortedAttributes`)
  or to languages/tooling outside the rule lists (CSS/HTML/YAML formatting, LSP,
  daemon).
- **Regenerate the `-stable` variants.** Because the addition is a nursery rule,
  `pnpm sync-stable` strips it; the `-stable` rule lists stay at 182 rules and
  change only in their `$schema` line.
- **Update documentation** — refresh every `2.5.4` reference in `README.md` (the
  Requirements line, Defaults → Schema URL, and the three FAQ mentions), bump the
  React strict **nursery** rule count from 71 to 72, and add the new rule to the
  nursery highlights list.
- **Add a changeset (`minor`).** This pass changes preset behavior for consumers —
  a new rule starts emitting diagnostics — matching the 1.7.0 / 1.8.0 / 1.9.0 /
  1.10.0 precedent where a Biome bump that added nursery rules shipped as a minor,
  while schema-only bumps (1.9.1, 1.10.2, 1.10.3) shipped as patches.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one modified requirement** and **one added
  requirement**.
  - *Version-tracking passes release according to their published impact*
    (MODIFIED) — it currently pins only the `patch` case (a bump with no
    rule-list change) and leaves the rule-adding case unstated, so this pass had
    to derive `minor` from CHANGELOG precedent. The requirement gains a sentence
    and a scenario making the `minor` case explicit; the existing patch and
    no-changeset scenarios are carried over verbatim.
  - *README rule inventory matches the presets* (ADDED) — the README publishes a
    per-category rule count and a highlights list for `react-strict`; a rule
    addition silently invalidates both. Records the practice already followed by
    every rule-adding release as a checkable requirement.

## Impact

- **Published package** (triggers a minor release): `dist/biome.react-strict.json`
  and `dist/biome.react-balanced.json` (new nursery rule + `$schema`), the other
  four `dist/*.json` presets (`$schema` only), `README.md`, and `package.json`
  (`@biomejs/biome` devDependency range). Consumers on `react-strict` /
  `react-balanced` see new `noNegationInEqualityCheck` warnings; `-stable`,
  `recommended`, and `react-recommended` consumers see no rule change.
- **Root config**: `biome.json` `$schema` (repo dogfoods the `recommended`
  preset, which has no nursery rules, so the repo's own checks are unaffected by
  the addition).
- **Specs**: `linter-rule-coverage` — one requirement modified (adds the
  `minor`-release case), one added (README inventory accuracy);
  `dev-tooling-currency` unchanged.
- **Not touched**: formatter / VCS / files / overrides settings, the other five
  rule categories, Node `engines`, non-Biome devDependencies (governed by
  `dev-tooling-currency`, out of scope here), and the package `version`
  (Changesets owns the release bump).
