# Design

## Context

See `intent.md` — Problem, and `proposal.md` — What Changes. The current state that
shapes the approach, all observed on 2026-09-26:

- **The binary is already at the target.** PR #212 moved the installed Biome and
  the `@biomejs/biome` range to 2.5.14; the presets, `biome.json`, the README, and
  `audit/rule-metadata.json` still say 2.5.13. `check:rule-metadata` therefore
  prints `skipped`, and `check:presets` passes against 2.5.13 (538 rules
  classified, 274 listed, 0 unaccounted) — so every failure this pass produces is
  one it caused.
- **One release, one hop.** npm published 2.5.13 on 2026-09-10 and 2.5.14 on
  2026-09-16, with nothing between them. The multi-release requirement ("diff each
  release in turn") has a single hop to diff, so the endpoint diff *is* the per-hop
  diff.
- **Both presets list `useDefaultSwitchClause`** (style, `warn`) **and
  `useExhaustiveSwitchCases`** (nursery, `warn`). This drives decision 4.
- **Relaxations are counted by whole-entry comparison.** `check:presets` counts
  a rule as relaxed when its balanced entry differs from strict's in any way,
  options included; the README table already carries three options-only rows
  (`noExcessiveLinesPerFunction`, `noIncrementDecrement`, `useNamingConvention`).
- **Biome 2.5.13 rejects a rule it does not know.** Pointed at a configuration
  that lists `noJsonUnsafeValues`, it stops with `Found an unknown key` and exit
  code 1. The package declares no peer dependency on Biome; the README is the only
  place a consumer learns which version to run.

## Goals / Non-Goals

**Goals:**

- Bring the pinned target, the snapshot, and the binary level at 2.5.14, so the
  drift check runs.
- Settle each added rule's level and the `requireExplicitCase` setting on recorded
  evidence — the intent's second open question.
- Record the outcome of every audit the standing requirements name, including the
  ones whose answer is "nothing".

**Non-Goals:**

- **Extending `check:presets` to read the React strict sentence.** The
  README-inventory invariant names where a preset total is enforced — the
  Configurations table and the ladder prose. Covering another place changes that
  requirement, which the intent holds unchanged. This pass corrects the sentence and
  reconciles it by computation; making that mechanical is a separate change.
- **Choosing options for the added rules.** All six land as bare severity strings,
  as every addition before them has. In particular the presets do not pick a
  `style` for `useConsistentFunctionStyle`.
- **README highlight entries for the six additions.** The nursery highlights are
  curated, and `check:presets` checks only that the rules it names exist.
- **A peer dependency on `@biomejs/biome`.** It would turn the version
  requirement above into a package-manager warning, but it is a packaging policy
  every later pass would have to maintain — a decision for its own change, not a
  side effect of this one.

## Prior decisions

None — `docs/adr/` does not exist yet.

## Decisions

### 1. The rule audit is the schema key diff

Rule keys under the eight category definitions of the 2.5.13 and 2.5.14
configuration schemas, excluding the non-rule `preset` and `recommended` keys:
**8 added, 0 removed, 0 moved**, 538 → 546 rules. For the option audit, every rule
present in both schemas was compared on its resolved option definition, not its
`$ref` name: **one** listed rule changed — `useExhaustiveSwitchCases` gained
`requireExplicitCase` (default `false`) — and no unlisted rule changed.

The regenerated snapshot must reproduce this as its own diff: `biomeVersion`, eight
added entries, and no change to any existing entry's category, severity,
recommended flag, domains, or example languages. The empty answers — nothing
graduated, renamed, or removed, and no transient rule, because there is no
intermediate release — are audit outcomes, not skipped steps.

### 2. Six of the eight are in scope, placed by the metadata alone

| Rule | Example languages | Domains | Biome default | Scope |
|---|---|---|---|---|
| `noJsonUnsafeValues` | json, jsonc | — | warn | in (language) |
| `noObsoleteTags` | jsx; also reports in HTML | — | warn | in (language) |
| `noReturnInFinally` | js | — | info | in (language) |
| `useConsistentFunctionStyle` | js, ts | — | info | in (language) |
| `useConsistentObjectKeys` | json | — | warn | in (language) — JSON-only, whatever the name suggests |
| `useValidTestTitle` | js | `test` | warn | in (language and domain) |
| `noSvelteAtDebugTags` | svelte | `svelte` | info | out (framework-only domain) |
| `noVueUndeclaredDirectives` | vue | `vue` | error | out (framework-only domain) |

No exclusion-ledger entry: the metadata places all eight, and the ledger rejects an
entry for a rule the metadata already classifies. `biome explain` calls three of
the in-scope rules "recommended"; they are nursery, which the recommended set never
activates, so their entries are opt-in, not redundant.

Requirements this pass does **not** exercise, recorded so the absence is visible:
no added rule resolves a definition (analysis scope), none documents a
dependency-based suppression (full trigger surface), none embeds a whole-program
analysis engine (cost attribution), and none is inert until configured —
`useValidTestTitle`'s `disallowedWords` is optional, and the rule reports without
it.

### 3. Levels, from fixtures run against the installed 2.5.14

The fixtures extend `react-strict` and list the six rules at `warn`, as the presets
will. They run in a directory with **no `package.json`**, plus a copy that declares
`vitest` for the gate test.

| Rule | Fires on | Silent on |
|---|---|---|
| `noReturnInFinally` | `p.finally(() => { return 2 })`; a `return` inside an `if` in the callback | `p.finally(() => setLoading(false))`; `p.finally(cleanup)`; a block with no `return` |
| `noObsoleteTags` | JSX `<font>`, `<center>`, `<big>`, `<strike>`; HTML `<center>`, `<marquee>` | `<span>`; the component `<Font />` |
| `noJsonUnsafeValues` | `9007199254740993`, `1e400`, `1e-400`, `"\ud83d"` | `1.5`, `42`, a valid surrogate pair |
| `useConsistentObjectKeys` | an NFD key, raw or escaped | NFC and ASCII keys |
| `useConsistentFunctionStyle` | `function helper()`, `export function Button()` | `export default function Page()`; arrow and function expressions; TypeScript overloads; callbacks |
| `useValidTestTitle` | `it("")`, `describe(" leading")`, `test(123)`, **`it(c.name)`, `describe(Foo.name)`** | `it("fine")`; template literals; `re.test(s)`, `/y/.test(s)` |

`useValidTestTitle` reported the same five diagnostics **with and without `vitest`
declared**: explicit listing defeats its `test` gate, so it reaches every consumer.

| Rule | strict | balanced | Ground |
|---|---|---|---|
| `noJsonUnsafeValues` | warn | warn | Fires only on the values it documents. |
| `noObsoleteTags` | warn | warn | Fires only on obsolete elements; components are exempt. |
| `noReturnInFinally` | warn | warn | Fires only on an explicit `return`. The common expression-bodied `.finally(() => setLoading(false))` is not reported. Biome's default is `info`, but it is a correctness rule and the convention puts additions at `warn` — `noThisOutsideOfClass` had the same shape in the 2.5.13 pass. |
| `useConsistentObjectKeys` | warn | warn | Fires only on unnormalized keys. |
| `useConsistentFunctionStyle` | warn | **off** | Purely stylistic — the rule asks the project to choose a style — and broadly firing. Under its default `"expression"` style it reports every function declaration that is not a default export: helpers, hooks, and named-export components alike, the form React's own documentation uses. That is the `useLayeredStyles` shape (a sanctioned practice reported everywhere), not the `useReactNamingConvention` shape (a narrow set of bindings), so `off` rather than Biome's default `info`: an `info` on every function declaration still reports across the whole codebase. |
| `useValidTestTitle` | warn | **info** | Reach alone would not relax it: its trigger is test-block calls, which match nothing outside test code — the framework requirement's "matches nothing outside its framework" case. The ground is noise *inside* test code: every non-literal title — a string-typed variable, `Foo.name` — is reported as "not a string", and its only option, `disallowedWords`, cannot exempt that. `info` keeps its real findings (empty, padded, or non-string titles) visible without failing a warnings-as-errors CI on correct code, following `noUndeclaredCustomProperties`, relaxed to `info` for reporting correct code. |

Alternatives rejected: `useConsistentFunctionStyle` at `info` in balanced (Biome's
default — still reports across the whole codebase); `useValidTestTitle` at `warn` in
balanced (warning-level diagnostics on correct code in parameterized suites, with
no configuration escape). Two fixes reach consumers through `biome check --write`
whatever the level: `useValidTestTitle`'s **safe** fix trims padded titles, and
`useConsistentObjectKeys`'s fix, which normalizes keys, is **unsafe** and applies
only under `--unsafe`.

### 4. `requireExplicitCase`: `true` in strict, upstream default in balanced

Fixture: a switch over `"a" | "b" | "c"` under `react-strict`, which also lists
`useDefaultSwitchClause`.

| Switch | default (`false`) | `true` |
|---|---|---|
| missing cases, has `default` | not reported | **reported** |
| missing cases, no `default` | reported (as is `useDefaultSwitchClause`) | reported |
| every case, plus `default` | not reported | not reported |
| over `string`, with `default` | not reported | not reported |

With the upstream default, `useExhaustiveSwitchCases` reports nothing that
`useDefaultSwitchClause` does not already report: the `default` clause one rule
demands is exactly what excuses the other. A preset that lists both wants switches
that keep a fallback *and* handle every member, so the default conflicts with its
intent. That is the standing requirement's "new option's default conflicts with a
preset's intent" case. `react-strict` therefore lists
`{ "level": "warn", "options": { "requireExplicitCase": true } }`, which the assist
places after the category's string-valued entries. Complete switches and switches
over non-union types are unaffected, so the added reports are confined to switches
that leave a union member to `default`.

`react-balanced` keeps the bare `"warn"`. A `default` that deliberately handles the
remaining members — a reducer handling a subset of actions — is a common, sanctioned
pattern, and reporting it is the noise balanced exists to remove. Balanced consumers
see no change from the setting as a result. The cost: balanced's
`useExhaustiveSwitchCases` stays largely redundant with `useDefaultSwitchClause`, as
it has been since both were listed. The entries differ, so this counts as a
relaxation, published as `warn (requireExplicitCase: true)` → `warn (default)`.

Alternatives rejected: `true` in both (the reducer noise, in the preset meant to
avoid it); the default in both (leaves strict's exhaustiveness check inert when the
setting exists to fix exactly that).

### 5. Resulting counts

| | today | after |
|---|---|---|
| `react-strict` / `react-balanced` listed | 274 | **280** |
| … of which nursery | 94 | **100** |
| `-stable` variants listed | 180 | 180 |
| balanced relaxations | 22 | **25** |
| … in stable categories (reach `react-balanced-stable`) | 15 | 15 |
| … in nursery | 7 | **10** |
| rules in the snapshot | 538 | **546** |

### 6. The React strict sentence is reworded, not only renumbered

It reads "Enables all recommended rules plus **263 optional and nursery rules**
across 8 categories." `263` was the preset total when the 2.5.11 pass wrote it; the
2.5.13 pass moved the total to 274 and missed it. Renumbering alone would publish
"280 optional and nursery rules", which is false: 9 of the entries override
recommended rules — 5 of them turn a recommended rule `off`, so "enables all
recommended rules" is not true either — and the optional and nursery entries
number 271. The sentence is reworded so that its number is the preset total, the
figure every other README total publishes, e.g. "On top of Biome's recommended
rules, it explicitly configures **280 rules** across 8 categories — every in-scope
optional and nursery rule, plus deliberate overrides of recommended ones."

Two wording constraints come from `check:presets`: the number must not follow an
em dash directly (`— (\d+) rules` is the `-stable` matcher, and would check it
against 180), and the phrase `up to N explicitly configured rules` must stay unique
to the ladder prose, because that matcher reads only its first match.

### 7. `CLAUDE.md` drops the drifting figure rather than renumbering it

It says evaluating the scope test's domain half alone "would flag 201 correct rules
in `react-strict`". It is 212 today — earlier passes added domain-free rules
without revisiting it — and would be 217 after this one. `CLAUDE.md` says counts are
deliberately not repeated there because a count in two places drifts, and this one
did. The sentence is reworded to carry no total ("every listed rule that declares
no in-scope domain — most of `react-strict`"). It keeps "the 33 that belong only to
domains the standing requirement never names", which this pass does not change.
Renumbering to 217 was rejected because almost every pass adds a domain-free rule.

### 8. Order of operations

1. `$schema` in the six presets and `biome.json`, and the README version
   references — target and binary now agree.
2. `pnpm sync-rule-metadata`, which refuses to run while they disagree. Between
   steps 1 and 2 the pinned-target invariant fails; that is expected mid-pass.
3. After the regeneration, coverage fails naming the six in-scope rules. That
   failure is the audit confirming itself, and it clears as they are added.
4. Add the six rules and the `requireExplicitCase` block, run `biome check --write`
   so the `useSortedKeys` assist orders them (`pnpm run check` does not catch
   misordering), then `pnpm sync-stable`.
5. README and `CLAUDE.md`, then the changeset, then the full check.

### 9. Inherited behaviour, grouped by the consumers it reaches

The schema cannot see these; they come from the 2.5.14 release notes, each placed by
the snapshot's recommended and category data and the preset listings. Four settings
all six presets ship put formatter and file-handling changes in front of every
consumer: `html.experimentalFullSupportEnabled`, `javascript.formatter.operatorLinebreak:
"before"`, `vcs.useIgnoreFile`, and `formatter.formatWithErrors: false`.

**All six presets:**

- *Formatter:* multiline template interpolations keep their closing-brace
  indentation (#11461); own-line comments before a binary operator stay above it
  under `operatorLinebreak: "before"` (#11718); a newline before `>` when a comment
  forces type arguments onto several lines (#11726); no extra parentheses or moved
  comments after operators such as `!` (#11790); no redundant parentheses around
  commented unary operands (#11724). In HTML: CJK line breaks preserved (#11735);
  PascalCase components such as `<Body>` in Vue, Svelte, and Astro no longer
  formatted as native elements, unknown elements named like SVG elements no longer
  block-formatted, and `<listing>` handled as an ordinary element (#11355).
- *Parser:* `readonly` combined with `accessor` in either order, and `accessor
  override`, are now errors; `override accessor` now parses (#11766).
- *Recommended rules:* `useAnchorContent` newly reports anchors in HTML, Astro, Vue,
  and Svelte that have only `aria-label`, `aria-labelledby`, or `title` (#11790).
  Fewer diagnostics from `noUselessFragments` (Astro), `noDescendingSpecificity`
  (across cascade layers), and `noUnusedImports`.
- *Files and fixes:* files re-included by a negation in a nested `.gitignore` are
  now linted and formatted (#11706); `--write` applies fixes inside HTML attribute
  expressions (#11743); assist-category suppressions such as `biome-ignore-all
  assist` are respected (#11770); the editor's `source.fixAll.biome` no longer
  formats a file with parse errors (#11735); test rules and the formatter treat
  `suite`, `fsuite`, `xsuite`, and `test.suite` like `describe` (#11729).
- The Vue, Svelte, and Astro items reach consumers with those files although the
  frameworks' rules are excluded — the standing requirement asks for exactly that
  disclosure.

**`react-strict`, `react-balanced`, and both `-stable` variants** (listed
stable-category rules): `useReadonlyClassProperties` newly reports static
properties that are never reassigned (#11720); safer fixes from
`useConsistentArrowReturn` (#11751) and `useSimplifiedLogicExpression` (#11731);
fewer diagnostics from `noUselessStringConcat`,
`noNoninteractiveElementInteractions`, `noUnknownAttribute`, `useUniqueElementIds`,
`useHookAtTopLevel`, `useSingleJsDocAsterisk`, and `noUndeclaredVariables` (aliased
imports in Vue single-file components).

**`react-strict` and `react-balanced` only** (listed nursery rules): new
diagnostics from `useIncludes` (#11739), `useExhaustiveSwitchCases` (#11733,
#11780), and `noFloatingPromises` (#11737); `useConsistentTestIt` also rewrites
imports (#11740); `noUndeclaredCustomProperties` no longer hangs (#11784); Tailwind
class names with dashed bases parse (#11792); false positives removed from
`useTailwindShorthandClasses` (#11791) and `useExhaustiveSwitchCases` (#11780).

**No consumer of this package:** the `useImportExtensions` fixes (`off` in every
preset); `noJsxLiterals`' `allowedStrings` matching (no preset sets it); code
actions with full HTML support disabled (every preset enables it); GritQL and
plugin fixes (no preset configures plugins). Tooling-only changes — the GitHub
reporter, `lint --suppress`, an editor suppression action, performance — are not
preset behaviour and are not disclosed as such.

### 10. Configuration migrations are previewed, not assumed

`biome migrate` without `--write` runs against a copy of each preset as a
`biome.json` and against the root `biome.json`. Each proposed rewrite is recorded
as adopted or declined, and adopted ones are applied by hand. The 2.5.14 release
notes announce no configuration deprecation, but migrate's output is the evidence,
not the notes.

### 11. The changeset

`minor`: both parent presets' rule lists change. It leads with the requirement to
run **Biome 2.5.14 or later** — `react-strict` and `react-balanced` name rules and a
setting 2.5.13 rejects. Next come the inherited changes that reach all six presets,
because `recommended`, `react-recommended`, and `-stable` consumers see no rule-list
movement to explain them. Then the four-preset and parent-only behaviour changes;
the six added rules with their levels; the three balanced relaxations with their
grounds; and the `requireExplicitCase` decision. It names the two rules left out
and why, gives the counts from decision 5, and records the corrected README total.
All eight new rules are named, the intent's success signal read literally.

## Constraints check

- **Standing coverage requirements apply unchanged.** No delta spec
  (`skip_specs: true`). Each decision rests on an existing requirement: in-scope
  rules enabled and out-of-scope rules derived from metadata (decision 2); the
  severity convention and the framework-gating observation (decision 3); new
  options only against an upstream default (decision 4); the behaviour audit
  (decision 9); tracking `latest` with a snapshot regeneration (decisions 1, 8);
  README inventory (decisions 5, 6); release sizing (decision 11). Requirements with
  nothing to act on are recorded under decisions 1 and 2.
- **`-stable` consumers opted out of experimental rules.** Every addition and the
  `requireExplicitCase` block sit in `nursery`, which `pnpm sync-stable` strips, so
  both `-stable` files change only in `$schema` and stay at 180 rules. Their
  consumers still receive 2.5.14's formatter, parser, and stable-rule behaviour,
  which is Biome's rather than an experimental rule, and which the changeset
  discloses.
- **No consumer configuration change.** No preset key is renamed or removed, and the
  migration preview (decision 10) checks that the presets are already current for
  2.5.14. The one thing a consumer must do is run Biome 2.5.14 or later with
  `react-strict` or `react-balanced`. That is a dependency version, not
  configuration; the README states it; and every pass that has added a rule has
  carried the same requirement. The changeset leads with it (decision 11).
- **No deadline.** Nothing to satisfy.

## Risks / Trade-offs

- [A consumer upgrades the package but not Biome, and `react-strict` or
  `react-balanced` stops with "Found an unknown key"] → Stated first in the
  changeset and in the README's requirements table. Enforcing it with a peer
  dependency is deliberately left to its own change (Non-Goals).
- [`useConsistentFunctionStyle` at `warn` makes `react-strict` loud — one diagnostic
  per function declaration in a codebase that uses them] → That is strict's
  opt-in-maximal contract. Balanced turns it off, the `-stable` variants never see
  it, and the relaxation table shows the choice before adoption. Consumers can pick
  `style: "declaration"` themselves.
- [`requireExplicitCase` adds strict diagnostics on union switches whose `default`
  covers several members] → Confined to exactly that shape by the fixture; balanced
  is unaffected; the changeset names it.
- [Inherited behaviour moves output for `recommended` and `-stable` consumers, with
  no rule-list change to signal it] → The changeset leads with the all-six group
  (decision 9).
- [The reworded React strict sentence can drift again, since no check reads it] →
  This pass reconciles it by computation; a matcher is a separate change
  (Non-Goals).
- [The balanced levels rest on fixtures, not a real-world corpus] → The fixtures
  cover each rule's documented forms and the idioms that decide noise
  (`.finally(() => f())`, named-export components, computed test titles). The tasks
  re-run them before the changeset repeats their claims.

## Migration Plan

Consumers upgrade the package together with Biome ≥ 2.5.14. Those who do not want
the new rules pin the previous minor or extend a `-stable` preset, whose rule
content does not change. Rollback is a package revert — the presets are data files
with no build step.
