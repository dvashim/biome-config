# Proposal: upgrade-biome-2-5-6

> Scope note: "update Biome version, add new relevant options" is read against
> today's upstream state. npm `latest` for `@biomejs/biome` is **2.5.6**
> (published 2026-07-28) and the installed binary is **already 2.5.6** —
> Dependabot moved the lockfile in `89f2b6a` on 2026-08-01 — but the presets
> still pin and document **2.5.5**. "New relevant options" was audited two ways:
> new linter rules **and** new non-rule configuration options. The 2.5.5 → 2.5.6
> schema diff adds exactly **one** rule and **no** new formatter/assist/files
> options, so the audit result is recorded below rather than assumed.

## Why

The presets carry a standing obligation to target the latest stable Biome release
and to explicitly enable every in-scope non-recommended rule
(`linter-rule-coverage`). Biome shipped **2.5.6** on 2026-07-28 and Dependabot
bumped the devDependency lockfile a day later, but nothing updated the
consumer-facing surface: the `$schema` URL in all seven config files, the
declared `^2.5.5` range, and every README version reference still say 2.5.5, and
the one rule 2.5.6 added is missing from the explicit opt-in lists.

This leaves the repo in a **split state** the standing spec does not describe —
the toolchain runs 2.5.6 while the published presets advertise 2.5.5 — which is
itself a defect in the requirement (see Modified Capabilities).

## What Changes

- **Advance the pinned target 2.5.5 → 2.5.6** — the `$schema` URL in all six
  `dist/*.json` presets plus the root `biome.json` (seven files), and the
  `@biomejs/biome` devDependency range `^2.5.5` → `^2.5.6`. The lockfile already
  resolves 2.5.6, so only its recorded `specifier` line changes.
- **Add one rule — `nursery/noJsRestrictedProperties`** to `react-strict` and
  `react-balanced` at `warn`, with **no** `options` block. It bans access to
  specific object/property pairs and is inert until a consumer configures
  `entries`, so it is shipped as a discoverable, consumer-configurable placeholder
  exactly like the existing `noRestrictedGlobals` / `noRestrictedImports` /
  `noRestrictedTypes` family, all three of which are listed at bare `"warn"` in
  both presets. Because it reports nothing by default it is neither noisy nor
  broadly-firing, so `react-balanced` keeps it at `warn` rather than relaxing it.
  Nursery, JS/TS — in scope because `recommended: true` never activates nursery.
- **Rule audit against 2.5.6 — one addition, nothing else.** A rule-name diff of
  the 2.5.5 and 2.5.6 JSON schemas (518 → 519 rules) shows `noJsRestrictedProperties`
  added under `nursery` and **no** rule renamed, graduated out of nursery, or
  removed.
- **Configuration-option audit — no new options.** The only new schema definitions
  in 2.5.6 are the four that belong to the new rule itself
  (`NoJsRestrictedPropertiesConfiguration`, `NoJsRestrictedPropertiesOptions`,
  `RestrictedPropertyEntry`, `RuleWithNoJsRestrictedPropertiesOptions`), and no
  existing definition gained or lost a property. There is no new formatter,
  assist, `files`, `javascript`, `json`, `html`, or `vcs` option for the shared
  blocks to adopt.
- **Regenerate the `-stable` variants.** The addition is nursery, so
  `pnpm sync-stable` strips it; the `-stable` rule lists stay at 182 rules and
  change only in their `$schema` line.
- **Update documentation** — refresh every `2.5.5` reference in `README.md` (the
  Requirements table and prose, the Defaults schema-URL sample, and the two FAQ
  mentions incl. the `pnpm add -D` line), raise the `react-strict` /
  `react-balanced` totals 254 → 255 and the nursery count 72 → 73, and add the
  new rule to the nursery highlights list. The `182` figures stay as they are.
- **Add a changeset (`minor`).** A new rule changes the diagnostics consumers
  receive, which the standing requirement pins as the `minor` case.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one modified requirement** and **one added
  requirement**.
  - *Presets track the latest stable Biome release* (MODIFIED) — the requirement
    keys its bump decision on "the installed Biome version", which this pass shows
    to be the wrong signal. Read literally today it misfires: installed (2.5.6)
    equals npm `latest` (2.5.6), so the *Already on latest* scenario matches and
    directs that "no `$schema` or dependency bump is made" — yet the `$schema`
    URLs say 2.5.5 and must be advanced. Meanwhile *Newer release available* does
    not match, because no release newer than 2.5.6 exists. An automated
    devDependency bump can move the installed version independently of the
    presets, so the requirement is re-keyed to the **pinned `$schema` target**
    and gains a scenario for the split state.
  - *Rules requiring configuration are listed without options* (ADDED) — records
    the convention this pass had to derive from the `noRestricted*` family: a rule
    that reports nothing until the consumer supplies options is still listed, at
    the normal severity and with no `options` block, so it is discoverable and
    overridable without the preset imposing a policy. Recurs for every future
    restricted-* rule.

## Impact

- **Published package** (triggers a minor release): `dist/biome.react-strict.json`
  and `dist/biome.react-balanced.json` (new nursery rule + `$schema`), the other
  four `dist/*.json` presets (`$schema` only), `README.md`, and `package.json`
  (`@biomejs/biome` range). Consumers on `react-strict` / `react-balanced` gain a
  configurable rule that is silent until they configure it; `-stable`,
  `recommended`, and `react-recommended` consumers see no rule change.
- **Root config**: `biome.json` `$schema` (the repo dogfoods the `recommended`
  preset, which carries no nursery rules, so its own checks are unaffected).
- **Specs**: `linter-rule-coverage` — one requirement modified, one added.
  `dev-tooling-currency` unchanged (the Biome devDependency is explicitly owned by
  `linter-rule-coverage`).
- **Not touched**: formatter / VCS / files / overrides settings, the other seven
  rule categories, the resolved lockfile version (already 2.5.6), Node `engines`, non-Biome
  devDependencies, and the package `version` (Changesets owns the release bump).
