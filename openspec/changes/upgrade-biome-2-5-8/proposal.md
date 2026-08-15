# Proposal: upgrade-biome-2-5-8

> Scope note: this is the recurring version-tracking pass. npm `latest` for
> `@biomejs/biome` is **2.5.8** and the installed range is **already `^2.5.8`** —
> it rode along in the `build(deps-dev): bump changesets to v3 and update dev
> dependencies` commit — while the presets still pin and document **2.5.7**. As in
> previous passes, "new relevant options" was audited two ways: new linter rules
> **and** new configuration options. The 2.5.7 → 2.5.8 schema diff adds exactly
> **three** rules, removes none, renames none, graduates none out of nursery, and
> adds no option to any already-listed rule, so the audit result is recorded below
> rather than assumed.

## Why

The presets carry a standing obligation to target the latest stable Biome release
and to explicitly enable every in-scope non-recommended rule
(`linter-rule-coverage`). Biome shipped **2.5.8**, and the dependency range moved
with an unrelated dev-dependency sweep, but nothing updated the consumer-facing
surface: the `$schema` URL in all seven config files and every README version
reference still say 2.5.7, and the rules 2.5.8 added are missing from the explicit
opt-in lists.

This is exactly the split state the standing requirement is keyed around —
installed binary ahead of the pinned `$schema` target — so the presets count as
lagging and the target advances.

## What Changes

- **Advance the pinned target 2.5.7 → 2.5.8** — the `$schema` URL in all six
  `dist/*.json` presets plus the root `biome.json` (seven files), and the five
  README version references. The `@biomejs/biome` range is **already `^2.5.8`**;
  this change adopts it rather than re-doing it.
- **Add two rules to `react-strict` and `react-balanced`; exclude the third:**
  - `noInvalidPropertyInitValue` (`warn` / `warn`) — checks that a CSS
    `@property` rule's `initial-value` matches the format its `syntax` declares.
    Browsers silently refuse to register a custom property whose `initial-value`
    is malformed, so this catches a real, invisible breakage. CSS, no domain,
    upstream default `info`, and marked *recommended* — but nursery, so
    `recommended: true` still does not activate it and the presets must list it.
    Narrow surface (only `@property` at-rules), so no balanced relaxation.
  - `useReactCompiler` (`warn` / **`off`**) — runs React Compiler in lint mode and
    reports components and hooks it cannot safely compile. `react` domain,
    upstream default `info`. `react-balanced` turns it off; see below.
  - `noSvelteLegacyConst` — **out of scope, deliberately excluded.** Its only
    domain is `svelte`, which the standing requirement names among the excluded
    framework-only domains.
- **Why `useReactCompiler` is `off` in balanced.** Unlike every rule added so far,
  this one reports code that is *correct today*. It flags the gap between a
  codebase and a whole-program architectural opt-in that the project may never
  have made — adopting React Compiler. Measured on a 60-file React fixture, it
  produced **100 diagnostics**, none of which indicates a defect. That is the
  balanced preset's "broadly firing" case in its strongest form, so balanced turns
  it off rather than merely lowering it to `info`. This is the **second** nursery
  relaxation, after `noTailwindArbitraryValue`.
- **`useReactCompiler` enforces its own dependency gate — measured, not assumed.**
  The presets declare no `domains` key, which for every other domain rule tested
  means explicit listing defeats Biome's dependency gating. This rule is the first
  exception: with an identical config, it reported **0** diagnostics for a project
  without `react` in `package.json` and **3** for the same sources with it. Two
  controls confirm the general rule still holds — `noImgElement` (next domain)
  and `useExhaustiveDependencies` (react domain) both reported identically with
  and without their gating dependency. Consequently the rule reaches only
  consumers who actually have React, and its cost falls only on them: a 60-file
  React fixture went 99 ms → 115 ms (+16%), while a 60-file non-React fixture went
  91 ms → 94 ms, within noise, with zero diagnostics.
- **Rule audit against 2.5.8 — three additions, nothing else.** A per-category
  rule-key diff of the 2.5.7 and 2.5.8 JSON schemas (522 → 525 rules) shows the
  three additions above, all under `nursery`, and **no** rule renamed, graduated
  out of nursery, or removed.
- **Configuration-option audit — no new option on any listed rule.** The only new
  schema definitions are those belonging to the three new rules; no shared
  configuration definition changed (no new formatter, assist, `files`,
  `javascript`, `json`, `html`, or `vcs` option) and the domain list is unchanged.
  `noInvalidPropertyInitValue` has an empty options object. `useReactCompiler`
  carries one option, `compilationMode`, defaulting to `infer` (analyze functions
  following React conventions); the alternatives are `annotation` (only
  `"use memo"`-annotated functions) and `all`, which the schema itself warns "can
  report React-specific diagnostics in non-React code". `infer` matches the
  presets' intent, so the entry stays a bare severity string with no `options`
  block, per the standing convention.
- **Regenerate the `-stable` variants.** Both additions are nursery, so
  `pnpm sync-stable` strips them; the `-stable` rule lists stay at 182 rules and
  change only in their `$schema` line. The balanced relaxation likewise does not
  reach `react-balanced-stable`.
- **Update documentation** — refresh every `2.5.7` reference in `README.md`, raise
  the `react-strict` / `react-balanced` totals 258 → 260 and the nursery count
  76 → 78, add both rules to the nursery highlights, add a `useReactCompiler` row
  to the balanced relaxation table (16 → 17 relaxations), and update the two
  places that reconcile the relaxation counts — 15 of the 17 now live in stable
  categories, and `react-balanced-stable` keeps exactly those 15. The `182`
  figures stay as they are.
- **Add a changeset (`minor`).** Preset rule lists change, which the standing
  requirement pins as the `minor` case.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one modified requirement** and **one added
  requirement**.
  - *Framework rules are enabled by explicit listing* (MODIFIED) — the requirement
    states flatly that an explicitly listed domain rule "applies regardless of the
    consumer's dependencies." `useReactCompiler` disproves that as a universal:
    it re-checks for `react` itself, so listing it does not make it run for
    consumers without React. The requirement is qualified to say explicit listing
    defeats the gate for most such rules while some self-gate, and its
    unconditional scenario is narrowed to rules that do not re-check.
  - *A listed domain rule's gating behavior is established empirically* (ADDED) —
    records the method this pass had to invent once the assumption failed: run the
    rule against fixtures with and without the gating dependency and record which
    behavior was observed, rather than inferring it from other rules in the same
    domain. The result decides who receives the diagnostics, so it also decides
    whether a balanced relaxation is warranted and whose runs pay the rule's cost.

## Impact

- **Published package** (triggers a minor release):
  `dist/biome.react-strict.json` and `dist/biome.react-balanced.json` (two new
  nursery rules + `$schema`), the other four `dist/*.json` presets (`$schema`
  only), `README.md`, and `package.json` (already-bumped `@biomejs/biome` range).
  `react-strict` consumers gain two `warn`-level rules; those with React installed
  additionally pay a React Compiler pass, measured at +16% on a 60-file fixture,
  while those without React see neither its diagnostics nor its cost.
  `react-balanced` consumers gain one, with `useReactCompiler` off. `-stable`,
  `recommended`, and `react-recommended` consumers see no rule change.
- **Root config**: `biome.json` `$schema` (the repo dogfoods the `recommended`
  preset, which carries no nursery rules, so its own checks are unaffected).
- **Specs**: `linter-rule-coverage` — one requirement added. `dev-tooling-currency`
  is exercised but unchanged; its existing requirements already cover the
  already-landed `@biomejs/biome` range bump.
- **Not touched**: formatter / VCS / files / overrides settings, the seven
  non-nursery rule categories, Node `engines` and `.node-version`, the CI
  workflows, and the package `version` (Changesets owns the release bump).
