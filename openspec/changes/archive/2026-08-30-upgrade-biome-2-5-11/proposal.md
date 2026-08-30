# Proposal: upgrade-biome-2-5-11

> Scope note: the recurring version-tracking pass. npm `latest` for
> `@biomejs/biome` is **2.5.11**; the presets pin and document **2.5.10**, and
> the installed binary is also 2.5.10 — no dependency sweep has run ahead this
> time, so the target and the binary move together.

## Why

The presets carry a standing obligation to target the latest stable Biome
release. 2.5.11 adds two nursery rules, one of which is in scope, and carries a
set of fixes to **recommended** rules that reach every preset without moving a
single rule list.

## What Changes

- **Advance the pinned target 2.5.10 → 2.5.11** — the `$schema` URL in all six
  `dist/*.json` presets and in `biome.json`, the version references in
  `README.md`, and the `@biomejs/biome` devDependency range.
- **Add `noUndeclaredCustomProperties`** (nursery, CSS/HTML/JSX) at `warn` in
  `react-strict` and **`info` in `react-balanced`**, which is Biome's own default
  severity for the rule. The relaxation is not the usual stylistic call — see
  below.
- **Exclude `noAstroSetHtmlDirective`** (nursery, Astro-only). Its only domain is
  `astro`, which the out-of-scope requirement names, so metadata places it
  without a ledger entry.
- **No other rule movement.** Nothing graduated, was renamed, was removed, or
  gained an option: the 2.5.10 and 2.5.11 configuration schemas differ only by
  the two new rules and their four generated option definitions.
- **Counts move asymmetrically.** `react-strict` and `react-balanced` go 262 →
  263 (nursery 82 → 83); both `-stable` variants stay at **180**, because the new
  rule is nursery and `sync-stable` strips it. Balanced relaxations go 18 → 19
  while the stable-category subset stays at **15**, for the same reason.
- **Regenerate `audit/rule-metadata.json`** — 522 → 524 rules.

### Why `react-balanced` turns the new rule off

Established empirically against 2.5.11, not inferred:

```
  fixture                                          fires?
  -------------------------------------------------------
  same-file.css     define + use in one file         no
  mod.module.css    self-contained CSS module        no
  A.jsx             style={{ color: 'var(--x)' }}    no
  cross-file.css    --brand defined in tokens.css   YES
  from-dependency   var(--radix-accent-9)           YES
  from-dependency   var(--brand, #fff)   fallback   YES
  B.jsx             style="color: var(--x)"         YES
  page.html         style="color: var(--x)"         YES
```

Resolution is **per file**. A custom property defined in `tokens.css` and used in
a sibling stylesheet is reported as undefined, in the same lint run. A `var()`
fallback — the idiomatic way to write a property defined elsewhere — does not
suppress it. The rule publishes **no options**, so there is no way to declare
externally-defined properties.

That means the ordinary architecture — tokens in one stylesheet, consumed
everywhere — produces a diagnostic on every `var()`. This is not noise on sloppy
code; it is noise on correct code, with no configuration escape hatch. The JSX
exposure is narrow by comparison: only the *string* `style` attribute fires, and
`style="…"` is not valid React, so a Tailwind or CSS-in-JS project sees nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`: one requirement is added.
  - **A rule's analysis scope is established empirically** (new) — a rule whose
    diagnostics depend on resolving a definition SHALL have its resolution scope
    tested before it is leveled, and a rule that reports correct code because the
    definition lives in another file, with no option to declare it, SHALL be
    treated as broadly firing for the balanced relaxation regardless of domain.

## Impact

- `dist/biome.react-strict.json`, `dist/biome.react-balanced.json` — one rule
  added; `$schema` in all six presets.
- `dist/biome.react-*-stable.json` — regenerated; `$schema` only, no rule change.
- `biome.json`, `package.json` — pinned target and dependency range.
- `README.md` — version references, the ladder bullet, four table cells, the
  nursery per-category count, two relaxation phrases, and a new relaxation-table
  row. `check:presets` now fails until every published total moves.
- `CLAUDE.md` — the nursery-relaxation sentence ("the other three" becomes four)
  and its `18`, which is a duplicate of a README count that **nothing checks**.
- `audit/rule-metadata.json` — regenerated.
- Release: **minor**. A preset rule list changes, so consumers' diagnostics move.
