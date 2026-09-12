# Proposal: upgrade-biome-2-5-13

> Scope note: the recurring version-tracking pass. npm `latest` for
> `@biomejs/biome` is **2.5.13**; the presets pin and document **2.5.11**. The
> installed binary is already **2.5.13** — a dependency sweep has run ahead, so
> `check:rule-metadata` is currently **skipping** rather than checking. This pass
> brings the target level with the binary and re-arms that check.
>
> The working tree also carries an uncommitted **pnpm 11.22.0 → 12.4.1** major
> bump and regenerated OpenSpec assets. Those belong to `dev-tooling-currency`,
> not here, and are left for their own pass. One fact worth carrying over: `pnpm
> ci` — which both workflows run — still exists in 12.4.1, verified against the
> installed binary, so the major does not break CI's install step.

## Why

The presets carry a standing obligation to target the latest stable Biome
release. Two releases have landed since 2.5.11. Together they add **14 nursery
rules**, 11 of which are in scope — the largest single-pass rule-set movement
since the presets were reconciled — and carry formatter, parser, and type-inference
changes that reach every preset without moving a rule list.

## What Changes

- **Advance the pinned target 2.5.11 → 2.5.13** — the `$schema` URL in all six
  `dist/*.json` presets and in `biome.json`, the version references in
  `README.md`, and the `@biomejs/biome` devDependency range (already bumped in the
  working tree).

- **Add 11 nursery rules** to `react-strict` and `react-balanced`. All 11 are
  nursery, so none reaches the `-stable` variants:

  | Rule | Biome default | strict | balanced |
  |---|---|---|---|
  | `noBunModules` | warn | warn | warn |
  | `noInvalidFileInputAccept` | error | warn | warn |
  | `noThisOutsideOfClass` | info | warn | warn |
  | `noUnmodifiedLoopCondition` | warn | warn | warn |
  | `noUnsafeIframeSandbox` | error | warn | warn |
  | `noXorAsExponentiation` | warn | warn | warn |
  | `useFlatMathMinMax` | warn | warn | warn |
  | `useModernMathApis` | warn | warn | warn |
  | `useBetterDomTraversing` | info | warn | **info** |
  | `useLayeredStyles` | warn | warn | **off** |
  | `useReactNamingConvention` | info | warn | **info** |

- **Exclude 3 rules** on their published domains, with **no** ledger entries —
  the metadata places all three and the ledger rejects an entry it already
  classifies: `noSvelteAtHtmlTags` (`svelte`), `noVueDeprecatedScopedSlots`
  (`vue`), `useVueBaseImport` (`vue`).

- **No other rule movement.** Diffing the configuration schemas **per hop**
  (2.5.11 → 2.5.12 → 2.5.13, not endpoint to endpoint): 8 rules added then 6,
  with 0 removed and 0 category moves at *both* hops, so nothing graduated out of
  nursery, nothing was renamed, nothing was removed, and no rule appeared and
  disappeared inside the gap. **No already-listed rule gained or changed an
  option** either — verified by comparing each rule's option `$ref` *and* the
  referenced definition body, not by reading the changelog.

- **Counts move asymmetrically.** `react-strict` and `react-balanced` go 263 →
  **274** (nursery 83 → **94**); both `-stable` variants stay at **180**. Balanced
  relaxations go 19 → **22** and nursery relaxations 4 → **7**, while the
  stable-category subset stays at **15**.

- **Regenerate `audit/rule-metadata.json`** — 524 → **538** rules — which also
  re-arms `check:rule-metadata`.

### Why balanced relaxes three of the eleven

Established empirically against the installed 2.5.13, in a fixture directory with
**no `package.json` and no dependencies**:

```
  rule                        fixture                                fires?
  ---------------------------------------------------------------------------
  useLayeredStyles            .card { color: red }                    YES
                              :root { --brand: #333 }                 YES
                              mod.module.css (CSS Module)             YES
                              @import "foo.css"                       YES
                              inside @layer base { … }                 no
  useReactNamingConvention    const Theme = createContext(null)       YES
                              const generated = useId()               YES
                              const node = useRef(null)               YES
                              ThemeContext / inputId / inputRef        no
  useBetterDomTraversing      el.childNodes[0] / children[0]          YES
                              el.parentElement.parentElement          YES
                              el.querySelector("a").querySelector()   YES
```

- **`useLayeredStyles` → `off`.** It reports every style rule and every `@import`
  that is not inside a cascade layer — one diagnostic per rule, per file, in a
  project that has not adopted `@layer`. CSS Modules, which are scoped by design
  and have no cascade problem to solve, are reported the same way. The rule
  publishes no options, so there is no way to exempt them. Not using cascade
  layers is an architecture choice, not a defect; this is the
  `noTailwindArbitraryValue` shape — a sanctioned practice flagged everywhere.

- **`useReactNamingConvention` → `info`.** It fired three times with no React
  dependency present, so explicit listing **defeats its `react@>=16` gate** — the
  established behaviour for listed domain rules, confirmed here rather than
  assumed. What it enforces is a naming convention on `createContext`, `useId`,
  and `useRef` results, which is purely stylistic and fires across an entire
  existing codebase on first adoption. `info` is also Biome's own default.

- **`useBetterDomTraversing` → `info`.** A stylistic preference over ordinary DOM
  code, whose fixes are unsafe by the rule's own account: `.childNodes[0]` is
  `undefined` when empty where `.firstChild` is `null`, `.closest()` matches any
  ancestor rather than a fixed number of hops, and merged `.querySelector()` calls
  search from a different node. `info` is Biome's own default.

The other eight stay at `warn` in both presets: each fired only on the pattern it
documents, and none fired on correct code.

### What `noBunModules` revealed

`noBunModules` suppresses itself when the consumer's `package.json` declares a
dependency matching a Bun builtin — a self-suppression on a rule that belongs to
**no domain**, which is a shape the presets have not had to reason about before.
The suppression is **partial**: with `bun` and `bun-types` declared, `import {
serve } from "bun"` is suppressed but `import { Database } from "bun:sqlite"`
still fires. A pass that tested only the bare specifier would have concluded the
rule self-gates and is harmless to Bun projects. It does not.

It stays at `warn` in both presets anyway: the rule's stated purpose — "useful for
client-side web projects that don't have access to those modules" — is exactly
this package's audience, and for a web project a `bun:*` import is a real bug. The
finding is recorded so the decision is deliberate, and generalized into a
requirement so the next domainless self-suppressing rule is tested properly.

### Upstream behaviour that reaches consumers without moving a rule list

- **Formatter output changes.** `declare` now prints before accessibility
  modifiers (`declare private readonly x`), comments are no longer moved next to a
  generic's `<` (which produced invalid TypeScript), CSS `url(@/…)` and `url(!…)`
  now parse and escaped whitespace is preserved, and formatter performance
  improved up to ~50%.
- **Assist fix.** `useSortedAttributes` no longer corrupts JSX attributes when
  nested elements also need sorting — this repo ships assists in all six presets.
- **Type-aware rules got materially better and faster.** Callback-parameter
  inference and namespace-import handling improved `noFloatingPromises`,
  `noMisusedPromises`, `noBaseToString`, `useNullishCoalescing`, `useRegexpExec`,
  `noUnnecessaryConditions`, `useExhaustiveSwitchCases` and ~10 more; a Zod-scale
  performance regression was fixed. Several of these are listed rules, so
  consumers will see **new** diagnostics on unchanged code.
- **Recommended-rule fixes reach all six presets**, `-stable` included:
  `noUnusedVariables` (declaration merging, merged namespaces, Unicode escapes),
  `noUnusedPrivateClassMembers` (×3), `noUselessConstructor`, `useAriaPropsForRole`,
  `useFocusableInteractive`, `useHeadingContent`, `noDescendingSpecificity`,
  `noShorthandPropertyOverrides`, `noDuplicateProperties`, `noInferrableTypes`,
  `useExplicitLengthCheck`, `noMisplacedAssertion`, `noUnresolvedImports`.
- **`useReactCompiler`** — a listed rule — had its experimental capitalized-call
  and effect-dependency checks disabled, and no longer panics on non-ASCII files.
  It is `off` in balanced, so this reaches `react-strict` consumers.
- **Excluded frameworks still reach consumers through the parser.** Astro and
  Svelte parser and formatter fixes land in files these presets process, even
  though their rules are excluded — the standing requirement calls for disclosing
  exactly this.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`: two requirements are added.
  - **A rule's dependency-based suppression is verified across its full trigger
    surface** (new) — a rule may suppress itself from the consumer's declared
    dependencies while belonging to no domain, and such suppression SHALL be
    tested against every trigger form the rule documents rather than one
    representative form, because a suppression covering one form and not another
    changes who actually receives the diagnostics.
  - **A pass spanning several releases diffs each release in turn** (new) — when
    a pass advances the target across more than one Biome release, the rule-set
    audit SHALL diff each release against its predecessor and take the union,
    because a rule added in an intermediate release and removed before the target
    nets out to nothing across the endpoints and is absent from an
    endpoint-to-endpoint diff entirely. Multi-release gaps are the normal
    consequence of a skipped pass or of a dependency bump moving the installed
    binary ahead of the presets, so this is the recurring case, not the exception.

## Impact

- `dist/biome.react-strict.json`, `dist/biome.react-balanced.json` — 11 rules
  added; `$schema` in all six presets.
- `dist/biome.react-*-stable.json` — regenerated; `$schema` only, no rule change.
- `biome.json`, `package.json` — pinned target and dependency range.
- `README.md` — seven version references, the ladder total, four Configurations
  table cells, the nursery per-category count, three relaxation phrases, the
  sentence naming the nursery relaxations, and three new relaxation-table rows.
- `CLAUDE.md` — the nursery count (**already stale at 82**, actual 83 → 94), the
  relaxation total in two places, the sentence naming the nursery relaxations, and
  the `total (18)` in the README-contract bullet, which is **also already stale**
  at 18 against an actual 19. Nothing checks this file.
- `audit/rule-metadata.json` — regenerated. `audit/rule-exclusions.json` unchanged.
- Release: **minor**. Preset rule lists change, so consumers' diagnostics move.
