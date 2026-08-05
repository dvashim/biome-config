# Proposal: upgrade-biome-2-5-7

> Scope note: this is the recurring version-tracking pass, read against today's
> upstream state. npm `latest` for `@biomejs/biome` is **2.5.7** (published
> 2026-08-04) and the installed binary is **already 2.5.7** — the in-flight
> dependency update on this branch moved `package.json` and `pnpm-lock.yaml`
> before anything else — but the presets still pin and document **2.5.6**. As in
> the previous pass, "new relevant options" was audited two ways: new linter
> rules **and** new configuration options. The 2.5.6 → 2.5.7 schema diff adds
> exactly **three** rules, removes none, and adds **one** rule option with no
> change to any shared configuration block, so the audit result is recorded below
> rather than assumed.

## Why

The presets carry a standing obligation to target the latest stable Biome release
and to explicitly enable every in-scope non-recommended rule
(`linter-rule-coverage`). Biome shipped **2.5.7** on 2026-08-04 and the
dependency bump already landed in the working tree, but nothing updated the
consumer-facing surface: the `$schema` URL in all seven config files and every
README version reference still say 2.5.6, and the three rules 2.5.7 added are
missing from the explicit opt-in lists.

This is the same split state the previous pass re-keyed the version-tracking
requirement around — installed binary ahead of the pinned `$schema` target — so
the standing requirement now resolves it correctly: the presets count as lagging
and the target advances.

## What Changes

- **Advance the pinned target 2.5.6 → 2.5.7** — the `$schema` URL in all six
  `dist/*.json` presets plus the root `biome.json` (seven files), and the five
  README version references. The `@biomejs/biome` range (`^2.5.6` → `^2.5.7`) and
  the lockfile are **already updated in the working tree**; this change adopts
  them rather than re-doing them.
- **Add three rules, all nursery, to `react-strict` and `react-balanced`:**
  - `noExtendNative` (`warn` / `warn`) — bans `Builtin.prototype.x = …` and
    `Object.defineProperty` on a built-in prototype. JS/TS, no domain, upstream
    default `info`.
  - `noNonScalableViewport` (`warn` / `warn`) — flags
    `<meta name="viewport" content="…user-scalable=no">`, a WCAG 1.4.4 violation.
    JSX/HTML, no domain, upstream default `error`; listed at `warn` per the house
    severity convention so the upgrade cannot turn a consumer's build red.
  - `noTailwindArbitraryValue` (`warn` / **`off`**) — flags Tailwind arbitrary
    values (`w-[400px]`, `text-[#555]`, `[color:red]`) in class attributes,
    configured utility functions, and tagged templates. `tailwind` domain,
    upstream default `info`. Arbitrary values are a sanctioned Tailwind escape
    hatch that real projects use deliberately, so `react-balanced` turns it off —
    the presets' **first** nursery relaxation.
- **Rule audit against 2.5.7 — three additions, nothing else.** A per-category
  rule-key diff of the 2.5.6 and 2.5.7 JSON schemas (511 → 514 rules) shows the
  three additions above, all under `nursery`, and **no** rule renamed, graduated
  out of nursery, or removed. (The previous pass quoted 518 → 519 for the same
  measure; that series counted each category's non-rule `preset` key, so it runs
  8 high. The delta — the number that matters for reconciliation — is unaffected.)
- **Configuration-option audit — one new rule option, not adopted.** No shared
  configuration definition changed: no new formatter, assist, `files`,
  `javascript`, `json`, `html`, or `vcs` option, and the domain list is unchanged
  (`tailwind` already existed in 2.5.6). The one addition is
  `useNullishCoalescing`'s `ignoreIfStatements` option, which also brings new
  default behavior — Biome now reports `if` statements that only assign to a
  nullish variable (`if (!a) { a = b }`) and can rewrite them to `??=`. Both
  presets already list `useNullishCoalescing` at bare `"warn"` and **keep it that
  way**, inheriting the new default rather than opting out of it.
- **Regenerate the `-stable` variants.** All three additions are nursery, so
  `pnpm sync-stable` strips them; the `-stable` rule lists stay at 182 rules and
  change only in their `$schema` line. The balanced nursery relaxation likewise
  does not reach `react-balanced-stable`.
- **Update documentation** — refresh every `2.5.6` reference in `README.md`,
  raise the `react-strict` / `react-balanced` totals 255 → 258 and the nursery
  count 73 → 76, add the three rules to the nursery highlights, add a
  `noTailwindArbitraryValue` row to the balanced relaxation table (15 → 16
  relaxations), and correct the two places that assert every relaxation lives in
  a stable category — 15 of the 16 now do, and `react-balanced-stable` keeps
  exactly those 15. The `182` figures stay as they are.
- **Refresh dev tooling** (`dev-tooling-currency`, no consumer impact) — adopt
  the `@types/node` `^26.1.2` and `publint` `^0.3.23` bumps already sitting in
  the working tree (both equal npm `latest`), and advance the `packageManager`
  pin `pnpm@11.18.0` → `11.20.0`, the one tool measurably behind `latest`.
  TypeScript (7.0.2), both Changesets packages, and the OpenSpec CLI (1.7.0, with
  `generatedBy` metadata matching) are already current — nothing to do there.
- **Add a changeset (`minor`).** Preset rule lists change, which the standing
  requirement pins as the `minor` case.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one modified requirement** and **two added
  requirements**.
  - *Framework rules are enabled by explicit listing* (MODIFIED) — the
    requirement names only Next.js and React Native, but the presets already list
    Playwright and Drizzle rules, and this pass adds a `tailwind`-domain rule.
    All of them are dependency-gated domains that the presets, which declare no
    `domains` key, activate unconditionally by listing each rule. The requirement
    is generalized to any dependency-gated domain, and its balanced-relaxation
    scenario is extended: a rule can be noisy **inside** its own framework by
    flagging a sanctioned practice (`noTailwindArbitraryValue` on arbitrary
    values), not only outside it (`noImgElement` on any `<img>`).
  - *New rule options are adopted only to override an upstream default* (ADDED) —
    records the convention this pass had to derive for `ignoreIfStatements`: a
    version-tracking pass audits every new option on an already-listed rule and
    adds an `options` block only where the preset disagrees with the new default,
    so entries stay bare severity strings and keep inheriting upstream changes.
  - *Balanced relaxations may live in nursery* (ADDED) — `react-balanced` relaxes
    a nursery rule when the severity convention calls for it, even though the
    relaxation cannot reach `react-balanced-stable`, and the README then reports
    the balanced relaxation count separately from the subset that applies to
    `react-balanced-stable`.

## Impact

- **Published package** (triggers a minor release):
  `dist/biome.react-strict.json` and `dist/biome.react-balanced.json` (three new
  nursery rules + `$schema`), the other four `dist/*.json` presets (`$schema`
  only), `README.md`, and `package.json` (already-bumped `@biomejs/biome` range).
  `react-strict` consumers gain three `warn`-level rules; `react-balanced`
  consumers gain two, with `noTailwindArbitraryValue` off. `-stable`,
  `recommended`, and `react-recommended` consumers see no rule change. Separately,
  consumers who upgrade their own Biome to 2.5.7 will see new
  `useNullishCoalescing` diagnostics on `if`-statement lazy initialization — an
  upstream behavior change the presets inherit rather than cause.
- **Root config**: `biome.json` `$schema` (the repo dogfoods the `recommended`
  preset, which carries no nursery rules, so its own checks are unaffected —
  `pnpm check` already passes against the installed 2.5.7 binary).
- **Dev tooling** (no changeset): `package.json` `packageManager` pin and the two
  already-bumped devDependency ranges, plus `pnpm-lock.yaml`.
- **Specs**: `linter-rule-coverage` — one requirement modified, two added.
  `dev-tooling-currency` is exercised but unchanged; its existing requirements
  already cover the pnpm and devDependency bumps.
- **Not touched**: formatter / VCS / files / overrides settings, the seven
  non-nursery rule categories, Node `engines` and `.node-version`, the CI
  workflows, and the package `version` (Changesets owns the release bump).
