# Design

## Context

See `intent.md` — Slice, and `proposal.md` — What Changes. The current state that
shapes the approach, all observed on 2026-10-23:

- **The binary is already at the target, through the uncommitted working tree.**
  The installed Biome is 2.6.2. The working tree declares `^2.6.2` and its lockfile
  importer records `specifier: ^2.6.2`, `version: 2.6.2`; `HEAD` declares and locks
  2.5.15. The presets, `biome.json`, the README, and `audit/rule-metadata.json` all
  say 2.5.15.
- **In that working tree, `pnpm run check` fails.** `check:format` and
  `check:sync-stable` stop because 2.6.2 rejects the repository's own configuration:
  the root `biome.json` extends `dist/biome.recommended.json`, which sets
  `javascript.parser.gritMetavariables`. `check:rule-metadata` passes against a
  **fetched** 2.5.15 (60 s, docs/adr/0001), `check:presets` reports `557 rules
  classified, 288 listed, 0 unaccounted`, and `check:publint` and `check:types` pass.
- **The published package does not load under 2.6.** A project extending
  `@dvashim/biome-config@1.20.0/react-strict` under 2.6.2 exits 1 with `Found an
  unknown key` for `gritMetavariables` and for every promoted rule still listed
  under `nursery`.
- **The working tree is not clean.** Beside the Biome range it holds unrelated bumps
  (`packageManager` pnpm 12.15.0, `@types/node ^26.6.5`, OpenSpec 1.14.3's
  regenerated `.claude/` assets) and the approver's own edit recording the shared
  intent's acceptance date. Only the Biome range belongs here.
- **Three releases, one source.** npm published 2.6.0, 2.6.1, and 2.6.2 on
  2026-10-21 between 09:51 and 11:08 UTC; `latest` is 2.6.2. Only
  `@biomejs/biome@2.6.2` is tagged and released upstream. Between the 2.6.0 release
  commit (`8c814e1`) and that tag (`0d9aef6`) the repository changes only
  changelogs, package version fields, and its lockfile, and the two intermediate
  entries read "Fixes a problem with npm publishing" (#12492) and "Fix another
  patch" (#12494). The problem was the platform binaries: npm holds no
  `@biomejs/cli-*` package for 2.6.0 or 2.6.1, so neither installs a `biome` that
  runs (`Cannot find module '@biomejs/cli-darwin-arm64/biome'`, measured during
  implementation). 2.6.2 is the first 2.6 release that does.
- **The evidence below comes from scratch copies, never the repository.** Sweeps ran
  in a copy with its pins moved; fixtures ran in scratch directories against the
  installed 2.6.2 and a fetched 2.5.15. The whole end state this design describes —
  presets, checker, sweep, ledger, snapshot, root configuration — was assembled in a
  scratch clone, where every `check:*` script passes except the README-inventory and
  pinned-target items that decisions 13 and 15 resolve.

## Goals / Non-Goals

**Goals:**

- Bring the pinned target, the snapshot, the declared range, and the binary level at
  2.6.2, so every check reads 2.6.2 from the installed binary.
- Settle each addition's level on recorded evidence, carry every promoted and renamed
  rule, and record what 2.6 does to rules the presets already activate and to the
  files they newly reach.
- Keep `pnpm run check` meaningful under 2.6: the checks classify 2.6's rules
  correctly and run over what they ran over before.
- Record the outcome of every audit the standing requirements name, including the
  empty ones.

**Non-Goals:**

- **Options for the additions.** All 27 land as bare severity strings. The defaults
  match the presets' intent: `noExcessiveStatementsPerFunction` `max: 10` (strict is
  the opt-in-maximal preset), `noTailwindRestyledComponents` `allow: []`,
  `useLowercaseTestTitle` `allowedPrefixes` unset, `useConsistentJsonFileRead`
  `readAs: "string"`.
- **README highlight entries for the additions.** The highlights are curated, and
  `check:presets` checks only that the rules they name exist.
- **Markdown or YAML rules, and Markdown formatting of this repository.** The shared
  intent leaves out groups the package does not ship.
- **Suppressing 2.6's processing of Markdown, YAML, SCSS, Apps Script, and `.htm`
  files** — `pnpm-lock.yaml` included — in the presets. The standing requirement
  discloses an excluded language's file handling rather than hiding it; decision 9
  departs from Biome's default only where its default damages files.
- **A fix-applicability override for `noTailwindLegacyUtilities`** (Risks).
- **A peer dependency on `@biomejs/biome`** — left to its own change, as in the
  previous passes.
- **Landing the unrelated working-tree changes, or reconciling the `intent-first`
  schema fork with OpenSpec 1.14.3's built-in schema.** Both are dev-tooling work
  under `dev-tooling-currency`.
- **`CLAUDE.md`'s claim that no past pass has an `intent.md` or `adr.md`.** It has
  been untrue since the 2.5.14 pass, not because of 2.6, so it is left for its own
  correction.
- **The Tailwind class parser's `parse` errors on concatenated class fragments**
  (`className={'text-' + color}` → `Expected a candidate but instead found
  'text-'`). Any listed Tailwind class rule produces them, the published
  `react-strict` produces the same four under 2.5.15 (exit 1, measured), and 2.6
  does not change them.
- **Making the sweep fail with a message, rather than an `EPIPE` crash, when the
  swept binary rejects the repository's configuration.** Decision 15's order of
  operations never reaches that state.

## Prior decisions

- **docs/adr/0001** (in force) — the snapshot is read, verified, and serialized by a
  binary of the release the presets pin: a fetched 2.5.15 until the pins move, the
  installed 2.6.2 afterwards. Serializing runs `biome check --write` through the
  repository's own configuration, which 2.6.2 refuses while the presets carry
  `gritMetavariables` — the sweep then dies with `EPIPE` (measured) — so that
  setting leaves the presets before the first 2.6.2 sweep (decision 15). This design
  relies on the ADR and revisits nothing.

## Decisions

### 1. The audit is three hops, and two of them are empty

| Hop | Configuration schema | Added | Removed | Out of `nursery` | Option changes |
|---|---|---|---|---|---|
| 2.5.15 → 2.6.0 | changed | 51 | 1 (`useSortedClasses`, renamed) | 59 | 4 rules (decision 10) |
| 2.6.0 → 2.6.1 | byte-identical | 0 | 0 | 0 | 0 |
| 2.6.1 → 2.6.2 | byte-identical | 0 | 0 | 0 | 0 |

The union is the endpoint diff; no rule is transient. The schemas are the
`configuration_schema.json` of each npm tarball (2.5.15's equals the one biomejs.dev
serves; biomejs.dev serves none for 2.6.0 or 2.6.1), compared per rule on fully
resolved fragments with descriptions stripped and one-value enums read as
constants. Outside the rules, 2.6.0 adds top-level and override `markdown`, `yaml`,
and `tailwind` sections; removes `javascript.parser.gritMetavariables` (decision 8);
narrows `extends` to an array or `"//"` (2.5.15 already refused any other string —
measured); bounds `lineWidth` to 1–320 and `indentWidth` to 24 (the presets set 80
and 2); adds a plugin `resolutionKind`, three GraphQL assist actions, and two assist
options; and closes the assist rule objects. Every other definition change is
notation (`enum` → `oneOf` of constants).

A scratch sweep of 2.6.2 produced **607** rules (557 today). Against the committed
snapshot it shows 51 added entries, 1 removed, 59 category moves — several with a new
default severity, and `noDuplicateFieldDefinitionNames` newly recommended — and three
changed existing entries: `noEmptySource` languages `js` → `yaml` (decision 7),
`noUselessReturn` `js` → `js`, `ts`, and `noTailwindRawColors` domains `tailwind` →
`project`, `tailwind`. Only `noEmptySource`'s changes a classification.

### 2. The 59 promotions: 48 relocate, 2 leave the lists, 9 were never listed

Each parent lists all 50 promoted in-scope rules at `warn`, and `react-balanced`
relaxes none of them, so every relocated entry keeps `warn` in both:

- **complexity (6):** `noExcessiveNestedCallbacks`, `noExcessiveSelectorClasses`,
  `noPlaywrightUselessAwait`, `noUnnecessaryTemplateExpression`, `useArraySome`,
  `useRegexpTest`
- **correctness (7):** `noComponentHookFactories`, `noJsxNamespace`,
  `noPlaywrightMissingAwait`, `noReactNativeRawText`,
  `usePlaywrightValidDescribeCallback`, `useReactAsyncServerFunction`,
  `useReactNativePlatformComponents`
- **security (1):** `useIframeSandbox`
- **style (16):** `noInlineStyles`, `noPlaywrightElementHandle`, `noPlaywrightEval`,
  `noPlaywrightWaitForSelector`, `noReactNativeLiteralColors`, `noTopLevelLiterals`,
  `useConsistentTestIt`, `useDomQuerySelector`, `useImportsFirst`,
  `useNamedCaptureGroup`, `useReduceTypeParameter`, `useTestHooksInOrder`,
  `useTestHooksOnTop`, `useThisInClassMethods`, `useUnicodeRegex`, `useVarsOnTop`
- **suspicious (18):** `noConditionalExpect`, `noDrizzleDeleteWithoutWhere`,
  `noDrizzleUpdateWithoutWhere`, `noDuplicateSelectors`, `noEmptyObjectKeys`,
  `noIdenticalTestTitle`, `noJsxLeakedDollar`, `noLoopFunc`,
  `noPlaywrightForceOption`, `noPlaywrightNetworkidle`, `noPlaywrightPagePause`,
  `noPlaywrightWaitForNavigation`, `noPlaywrightWaitForTimeout`,
  `noReactNativeDeepImports`, `noReactStringRefs`, `noUntrustedLicenses`,
  `useBaseline`, `useExpect`

`useMathMinMax` (complexity) and `useDomNodeTextContent` (performance) become
recommended, domain-free, and stable at their default `warn` — the level both parents
give them — so the redundancy invariant drops both entries. Both stay active at
`warn` through Biome's recommended set, which now runs them in every preset. Both
requirements hold: no rule's effective level moves in either parent, and nothing is
reset to a Biome default. Several relocated domain rules now default to `error`
(e.g. `noDrizzleDeleteWithoutWhere`); the presets keep `warn`, as the graduation
requirement demands, and those entries become deliberate overrides.

The nine promoted rules no preset lists stay out: six Vue rules and
`useScopedStyles` (`vue`), `useQwikLoaderLocation` (`qwik`), and the GraphQL-only
`noDuplicateFieldDefinitionNames`. What their promotion does to consumers is in
decision 16.

### 3. `useSortedClasses` becomes `useTailwindSortedClasses`

Renamed (#12157); both parents keep `warn`. The rule moved to Tailwind CSS v4 class
order, lost its own `attributes` and `functions` options to the top-level `tailwind`
section (#12149) — the presets set neither — and now belongs to the `project` and
`tailwind` domains. The parents already list project-domain rules, so it adds no
project scan. It also reaches HTML-ish files (#11102). Gate, measured: it reports
identically with no `package.json`, with `tailwindcss` 3, and with `tailwindcss` 4,
so explicit listing defeats the `tailwind` gate as it did when the rule had no
domain. It leaves a list of non-Tailwind names (`btn btn-primary card`) alone and
reorders one that mixes them with Tailwind-shaped names.

### 4. Scope: 27 additions in, 23 out

| Rule | Example languages | Domains | Biome default |
|---|---|---|---|
| `noAccidentalBitwiseOperators` | js | — | warn (reported recommended) |
| `noArgumentsCallerOrCallee` | js | — | warn (reported recommended) |
| `noDoubleComparison` | js | — | warn (reported recommended) |
| `noExcessiveStatementsPerFunction` | js | — | warn |
| `noInvalidThis` | js, ts | — | info |
| `noNestedSwitch` | js | — | info |
| `noNestedTemplateLiterals` | js | — | info |
| `noObjectConstructor` | js | — | info |
| `noOctal` | cjs, js | — | warn (reported recommended) |
| `noProcessExit` | js | — | warn |
| `noPromiseExecutorReturn` | js | — | warn |
| `noTailwindLegacyUtilities` | jsx | `tailwind` | warn |
| `noTailwindRestyledComponents` | jsx | `tailwind` | info |
| `noUnsafeUnaryMinus` | ts | `types` | info |
| `noUselessAssignment` | js | — | warn (reported recommended) |
| `noUselessCall` | js | — | info (reported recommended) |
| `noUselessDateGetTime` | js | — | warn (reported recommended) |
| `noZeroFractions` | js | — | info |
| `useBigintLiterals` | js | — | warn (reported recommended) |
| `useCapitalizedConstructors` | js | — | warn (reported recommended) |
| `useConsistentJsonFileRead` | js | — | info |
| `useLowercaseTestTitle` | js | `test` | info |
| `useMatchingFunctionName` | js | — | info |
| `useNamedFunction` | js | — | info |
| `useSimplifiedBooleanReturn` | js | — | info (reported recommended) |
| `useTailwindStaticClassStrings` | js, jsx | `tailwind` | info |
| `useUnaryMinus` | js | — | warn (reported recommended) |

All 27 are `nursery`. The eleven that `biome explain` calls recommended are opt-in
entries, not redundant ones: the recommended set never activates `nursery`.

Out, by domain (18): `noSvelteAddEventListener`, `noSvelteClassDirective`,
`noSvelteInspect`, `noSvelteObjectInTextMustaches`, `noSvelteUselessDerivedBy`,
`useSvelteKitResolve`, `useSvelteReactiveClasses`, `useSvelteShorthandDirective`
(`svelte`); `noVueBooleanDefault`, `noVueLifecycleAfterAwait`,
`noVueRequiredPropWithDefault`, `noVueRootVIf`, `noVueShadowNativeEvents`,
`noVueVHtml`, `noVueVText`, `useVueConsistentEventHyphenation`,
`useVueMatchingComponentFileName` (`vue`); `useConsistentBlockLang` (`svelte`,
`vue`). `useSvelteKitResolve` and `useVueMatchingComponentFileName` publish `js`
examples too, but every domain they declare is excluded. Out, by language (5):
`noDuplicateMapKeys` (`yaml`), `useConsistentHeadingLevel`, `useFencedCodeLanguage`,
`useSingleTopLevelHeading`, `useTopLevelHeading` (`md`) — decision 6.

Requirements this pass exercises only partly, recorded so the absence is visible:
**analysis scope** — no addition resolves a definition across files;
**dependency-based suppression without a domain** — none observed;
**configuration-required rules** — none, every addition reports under its defaults.
Gating is measured in decision 5.

### 5. Levels, from fixtures run against the installed 2.6.2

The fixtures extend a scratch build of the new `react-strict` with
`vcs.enabled: false`. The same sources run in four directories — no `package.json`,
`tailwindcss` 3, `tailwindcss` 4, and `vitest` — for the gate tests.

| Rule | Fires on | Silent on |
|---|---|---|
| `noExcessiveStatementsPerFunction` | an 11-statement component (three `useState`, a ref, an effect, handlers, derived values); a `describe` callback holding 11 `it` calls | — |
| `useLowercaseTestTitle` | `describe('Button', …)`, `it('Handles click', …)` | `describe('useCounter hook', …)`, `it('renders', …)` |
| `useTailwindStaticClassStrings` | `'text-' + color`, `` `bg-${color}-500` ``, and non-Tailwind `'btn-' + variant`, `` `card--${variant}` `` | static class strings |
| `noTailwindRestyledComponents` | `<Button className="rounded-none bg-red-500" />` (2) | `<Button className="primary large" />`, `<Button className="w-full mt-4" />` |
| `noTailwindLegacyUtilities` | `flex-grow`, `bg-gradient-to-r`, and Bootstrap's `flex-grow-1`; its safe fix rewrote `btn flex-grow-1 flex-shrink-0` to `btn grow-1 shrink-0` | `shadow-sm`; `bg-gradient-to-r` when `tailwindcss` 3 is declared |
| `noPromiseExecutorReturn` | `new Promise((resolve) => setTimeout(resolve, ms))`, `resolve(1)`, `(resolve, reject) => fn(resolve, reject)` | a block-bodied executor |
| `useCapitalizedConstructors` | `Person()`, `new dayjs()`, `Schema.Struct({})`, `Type.Object({})`, `Option.Some(1)`, `Intl.NumberFormat('en-US')` | `Number()`, `String()`, `Boolean()`, `Symbol()`, `BigInt()`, `Date()`, `Error()`, `Array(3)`, `RegExp()`, `Function()`, `new Intl.DateTimeFormat()` |
| `noInvalidThis` | `this` in a module-level `function helper()`, and in a `function` passed to `addEventListener` | the capitalized `function Legacy() { this.a = 1 }` |
| `noUselessAssignment` | `let x = 0` overwritten in both branches | `result = null` read after a `try`/`catch`; an accumulator |
| `noAccidentalBitwiseOperators` | — | `if (f & 4)`, `f \| 2` |
| `noNestedTemplateLiterals`, `useNamedFunction`, `useMatchingFunctionName`, `noZeroFractions`, `useUnaryMinus`, `useBigintLiterals`, `noObjectConstructor`, `useConsistentJsonFileRead`, `useSimplifiedBooleanReturn`, `noUselessDateGetTime`, `noUselessCall`, `noDoubleComparison`, `noNestedSwitch`, `noProcessExit` | each one documented form (`useConsistentJsonFileRead`: `JSON.parse(await fs.readFile(p))`) | `useConsistentJsonFileRead`: the same read with `'utf8'` |

**Gates:** the four Tailwind rules and `useLowercaseTestTitle` reported the same
diagnostics in all four directories. Explicit listing defeats both gates, so they
reach every consumer of the parents. `noTailwindLegacyUtilities` is partly
version-aware: with `tailwindcss` 3 declared it skips the gradient rename and keeps
the others.

| Rule | strict | balanced | Ground |
|---|---|---|---|
| `noExcessiveStatementsPerFunction` | warn | **off** | Its default of ten statements reports an ordinary hook-using component and any `describe` with more than ten tests. |
| `noTailwindLegacyUtilities` | warn | **off** | Outside Tailwind v4 it reports class names Tailwind once used — Bootstrap's `flex-grow-1` — and its **safe** fix rewrites them. |
| `noTailwindRestyledComponents` | warn | **off** | A design-system policy, reporting every appearance utility passed to a component; balanced turns `noTailwindRawColors` off on the same ground. |
| `useLowercaseTestTitle` | warn | **off** | Reports the `describe('ComponentName')` convention, and its fix lowercases the component name. |
| `useTailwindStaticClassStrings` | warn | **off** | Reports every class string assembled from fragments, Tailwind or not. |
| the other 22 | warn | warn | Each fires on its documented pattern. |

Kept at `warn` in balanced, with the reports a team may meet:
`noPromiseExecutorReturn` reports the `setTimeout` sleep idiom, fixed by bracing the
executor. `useCapitalizedConstructors` reports capitalized calls of schema libraries
and `Intl.NumberFormat()` without `new`, with no option to exempt them; elsewhere it
is accurate, and Biome already calls it recommended. `noInvalidThis` reports `this`
in `function` callbacks that a caller binds, rare in React code.
`noNestedTemplateLiterals` is targeted; unlike nested ternaries it is not an idiom of
conditional rendering.

Alternatives rejected: `info` for any of the five (each still reports across a
codebase); a raised `max` for `noExcessiveStatementsPerFunction` (any threshold still
trips large `describe` blocks, and the number would be arbitrary); relaxing
`noPromiseExecutorReturn`, `useCapitalizedConstructors`, `noInvalidThis`, or
`noNestedTemplateLiterals` (accurate on their documented patterns).

### 6. Markdown and YAML leave the scope through the spec and the checker

- **The exclusion.** `EXCLUDED_LANGUAGES` in `scripts/check-presets.ts` becomes
  `graphql`, `md`, `yaml`, and the `linter-rule-coverage` delta names Markdown and
  YAML beside GraphQL. Measured without it: coverage reports the five as awaiting
  classification. Rejected: ledger entries, because the metadata does classify these
  rules and every future Markdown rule would need one; listing them, because the
  shared intent excludes groups the package does not ship.
- **The fence fix.** `parseExplain` reads a fence only when it opens one, tracking
  the opening character and length so that a closing fence must match and anything
  shorter inside is content. Measured on all 607 rules: only
  `useConsistentHeadingLevel` (`[]` → `md`) and `useFencedCodeLanguage` (`js`,
  `python` → `md`) change. Before the fix, coverage demands that the presets list
  `useFencedCodeLanguage` as a JavaScript rule. 2.5.15's 557 rules publish no nested
  fence, so the fix is verified neutral against them before the pins move.

### 7. `noEmptySource` is recorded in scope in the ledger

#12214 replaced the rule's documented examples with YAML ones, so the snapshot
reads `yaml` alone. With `yaml` excluded, listed-rule scope flags it in all four
presets that list it (measured). Under 2.6.2 the rule still reports an empty `.js`
and an empty `.css` file (measured), so the presets keep it. A ledger entry with
direction `in` records why — the delta's "documented only in an excluded language"
scenario. Rejected: dropping the rule, which still reports empty JavaScript and CSS
files.
The checker accepts the entry because derivation alone would place the rule out.

### 8. `gritMetavariables` leaves all six presets, and every preset needs Biome 2.6

2.6 removed `javascript.parser.gritMetavariables` (#12424: internal, no effect on
parsing) and refuses any configuration that sets it. All six set it to `false`, so
it goes from all six, and from the README's Defaults table. Measured on the final
presets: all six load under 2.6.2; under 2.5.15 none does, with 1 unknown key in
the two recommended presets (`markdown`, decision 9), 77 in each parent, and 49 in
each `-stable` variant. `biome migrate` does not propose removing the setting
(decision 17).

### 9. Markdown front matter is parsed: the one option adopted

2.6 formats and lints Markdown by default with front-matter parsing **off**, so the
`---` that opens front matter reads as a thematic break and the settings below it as
prose. Measured with `biome format --write`:

| File | 2.6 default | `markdown.parser.frontmatter: true` |
|---|---|---|
| a Changesets file (`---` / `'@dvashim/biome-config': minor` / `---`) | becomes `## '@dvashim/biome-config': minor` — the file no longer has front matter | intact; the key's quotes become `"` |
| nested front matter (`metadata:` with indented keys) | a blank line after `---`, and the nested keys flattened | intact |

The README tells teams to run `biome check --write`, and nearly every package
repository keeps Changesets files. All six presets therefore set `"markdown":
{ "parser": { "frontmatter": true } }` in their shared blocks. This is the
new-options requirement's test applied to a new top-level option: the presets'
intent — a documented workflow that does not damage files — differs from the
upstream default. Rejected: disclosure alone, which would publish that workflow
knowing it corrupts files; turning Markdown formatting off, which suppresses more
than the damage. Cost: the two recommended presets now need Biome 2.6 as well. The
test is recorded for later releases' settings in `docs/adr/0002`.

### 10. The option audit

| New in 2.6 | Reach | Default | Outcome |
|---|---|---|---|
| `noRedundantRoles.ignoreElements` | recommended a11y rule, unlisted | none | not set: checking every element is the intent |
| `noTailwindArbitraryValue.allowedCategories`, `.allowedClasses` | strict `warn`, balanced `off` | empty | not set: strict reports every arbitrary value. The rule also stops reporting arbitrary modifiers (#12194), inherited |
| `noUnusedVariables.ignoreUsingDeclarations` | recommended, unlisted | `false` | not set. With `useDisposables` (both parents) a never-read `using lock` is reported and `using _lock` is not; TypeScript 7.0.2's `noUnusedLocals` reports the same binding (TS6133), and the rule's fix adds the `_` |
| `useLogicalProperties` fix and its `fix` setting | strict `warn`, balanced `off` | — | no preset sets fix applicability |
| `markdown.parser.frontmatter` | all six | `false` | **adopted** (decision 9) |
| other `markdown` settings — `analyzeEmbeds`, `formatEmbeds`, `gfm`, `cjkFriendlyEmphasis`, `proseWrap`, formatter and linter `enabled` | all six | Biome's | not set |
| `yaml` settings | all six | Biome's; the global formatter settings apply | not set |
| `tailwind.attributes`, `.mergeFunctions`, `.variantFunctions` | Tailwind rules in the parents | `class`, `className`; `clsx`, `tw`, `twMerge`, `twJoin`, `cn`, `cc`, `cnb`, `ctl`; `cva`, `tv` | not set: the defaults are the ecosystem's |
| `tailwind.stylesheet` | same | none | not set: a project path a shared preset cannot know |
| plugin `resolutionKind` | — | — | no preset configures plugins |
| `useSortedAttributes.sortFirst`, `useSortedInterfaceMembers.partitionByNewLine`, three GraphQL sorting actions | — | — | measured: no assist action among them runs under the presets' `"preset": "recommended"` |

### 11. The repository's own checks under 2.6

Under 2.6.2 the repository's checks would format **79** Markdown files — 50 archived
change artifacts, the specs and schema templates, `docs/adr/0001`, 21 `.claude/`
commands and skills (20 of them generated by the OpenSpec CLI), the
Changesets-generated `CHANGELOG.md`, `CLAUDE.md`, and the published `README.md` (110
changed lines, mostly table padding) — plus `pnpm-lock.yaml` (133 changed lines in a
file pnpm writes) and the two workflow files. The root `biome.json` gains `"files": { "includes": ["**",
"!**/*.md", "!pnpm-lock.yaml"] }`, and the workflows take the YAML formatter's double
quotes (two lines each). With that, `check:format` passes on the assembled end
state. ADRs are immutable, archives are history, generated assets are never edited
by hand, and reformatting the README is a published change outside this slice.
Rejected: language-level `markdown`/`yaml` switches (they leave the lockfile and
scatter the scope); excluding only some Markdown (the README question remains).
`CLAUDE.md`'s root-configuration paragraph records the exclusion.

### 12. Resulting counts

| | today | after |
|---|---|---|
| `react-strict` / `react-balanced` listed | 288 | **313** |
| … a11y / complexity / correctness / nursery | 8 / 16 / 24 / 108 | 8 / **22** / **31** / **85** |
| … performance / security / style / suspicious | 11 / 4 / 76 / 41 | 11 / **5** / **92** / **59** |
| `-stable` variants listed | 180 | **228** |
| balanced relaxations | 28 | **33** |
| … in stable categories (reach `react-balanced-stable`) | 15 | 15 |
| … in nursery | 13 | **18** |
| rules in the snapshot | 557 | **607** |
| ledger entries | 1 | **2** |

### 13. README edits, inside the matchers' constraints

- The seven version references, with historical mentions such as "Biome 2.5.0" left
  alone.
- `up to 288 explicitly configured rules` → 313; the React strict sentence's
  `**288 rules**` → 313; the per-category counts from decision 12.
- The Configurations table: `React strict` → `313` / `85`; `React balanced` →
  `313, 33 relaxed` / `85`; `React strict-stable` → `228`; `React balanced-stable` →
  `228, 15 relaxed`.
- The `-stable` sections: `— 180 rules across 7 categories` → 228; `— 180 rules,
  with the 15 stable-category relaxations` → 228, and `the thirteen nursery
  relaxations` → `eighteen`.
- `**28 targeted relaxations**` → 33; `Fifteen of the 28 relaxations` → 33. Five
  `nursery` rows in alphabetical position, each `warn` → `off` with decision 5's
  ground in one line; the nursery note names eighteen rules.
- The highlights. Promoted names leave the nursery bullet for their category's:
  - complexity: `noExcessiveNestedCallbacks`, `noExcessiveSelectorClasses`,
    `useArraySome`, `useRegexpTest`;
  - correctness: `noComponentHookFactories`, `noJsxNamespace`,
    `useReactAsyncServerFunction`, `noReactNativeRawText`,
    `useReactNativePlatformComponents`;
  - security: `useIframeSandbox`;
  - style: `noInlineStyles`, `noReactNativeLiteralColors`, `useConsistentTestIt`,
    `useDomQuerySelector`, `useNamedCaptureGroup`, `useReduceTypeParameter`,
    `useTestHooksInOrder`, `useTestHooksOnTop`, `useThisInClassMethods`,
    `useUnicodeRegex`;
  - suspicious: `noConditionalExpect`, `noDrizzleDeleteWithoutWhere`,
    `noDrizzleUpdateWithoutWhere`, `noDuplicateSelectors`, `noIdenticalTestTitle`,
    `noReactNativeDeepImports`, `noReactStringRefs`, `noUntrustedLicenses`,
    `useExpect`.

  The "full suite of 11 Playwright rules" leaves nursery as a whole; its rules land in
  four categories. `useMathMinMax` and `useDomNodeTextContent` leave the README, and
  `useSortedClasses` becomes `useTailwindSortedClasses`. The nursery note on
  graduations adds 2.6.0.
- The omitted-rules sentence adds Markdown and YAML.
- Defaults: drop the `parser.gritMetavariables` row; add a Markdown table with
  `parser.frontmatter` `true`.

The `check:presets` constraints, as before: no number directly after an em dash
except the `-stable` totals the `— (\d+) rules` matcher reads; `up to N explicitly
configured rules` stays unique; no bolded version other than the target.

### 14. `CLAUDE.md` and the sweep's own description

`CLAUDE.md`: the shared-blocks list gains `markdown`; the out-of-scope line adds
Markdown- and YAML-only rules; the fences paragraph says an example is read by its
opening fence; the `useMathMinMax` false positive is dated to 2.5.14 (the rule is no
longer `nursery`); the ledger paragraph names two entries; the root-configuration
paragraph records decision 11. The doc comment above `parseExplain` describes
opening fences. Checked and unchanged: 16 GraphQL-only rules; `noRestrictedTypes` is
still the only rule with no example language; "11 of the 119 in 2.5.14" is dated and
stays true (2.6.2: 25 of 121).

### 15. Order of operations

1. Fix fence reading in `scripts/sync-rule-metadata.ts`. `check:rule-metadata`
   still verifies against a fetched 2.5.15 and must still match 557 rules.
2. In one step: remove `gritMetavariables` and add the `markdown` block in the four
   hand-maintained presets; advance `$schema` in the six presets and `biome.json`,
   the README version references, and the dependency range; add the root `files`
   exclusion; format the workflows. The repository's configuration now loads under
   2.6.2.
3. `pnpm sync-rule-metadata` sweeps the installed 2.6.2 — 607 rules. Its diff must
   be decision 1's, with decision 6's two Markdown languages.
4. `EXCLUDED_LANGUAGES`, and the `noEmptySource` ledger entry. `check:presets` now
   reports only category placement (50), rule existence (`useSortedClasses`),
   coverage (the 27 and `useTailwindSortedClasses`), and the README.
5. Relocate 48, drop 2, rename 1, add 27; `biome check --write` so the
   `useSortedKeys` assist orders them; `pnpm sync-stable`. `check:presets` now
   reports only the README.
6. README, `CLAUDE.md`, the probes, the migration preview, the changeset, the full
   check.

### 16. Inherited behaviour, grouped by the consumers it reaches

From the release notes, each item placed by the snapshot's category and recommended
data and by the preset listings. All six presets ship
`html.experimentalFullSupportEnabled: true`,
`javascript.experimentalEmbeddedSnippetsEnabled: true`, `vcs.useIgnoreFile: true`, and
`formatter.formatWithErrors: false`.

**All six presets:**

- *Configuration:* the Biome 2.6 requirement (decision 8). A team's own
  configuration stops loading if it sets `gritMetavariables`, lists a promoted rule
  under `nursery`, or names `useSortedClasses` or its removed options;
  `biome migrate --write` fixes the last two. Resolving two versions of one extended
  package is now an error, and a repeated reference an information notice (#11432).
- *New files* (measured; 2.5.15 processed none): Markdown is formatted and linted
  (#11394), and its fenced code is formatted with the presets' JavaScript settings
  (`formatEmbeds`); YAML is formatted (#11451), `pnpm-lock.yaml` and workflow files
  included; SCSS is formatted and linted (#12132); `.gs` files parse as Apps Script
  (#10837), `.htm` as HTML (#11126). Decision 9 protects front matter.
- *Recommended rules, unlisted:* newly report inside labeled loops
  (`noUnreachable`, `noUnreachableSuper`, `useGetterReturn`,
  `useIterableCallbackReturn`, `noFallthroughSwitchClause`, #12117) and treat
  `for (;true;)` as infinite (#12240); more from `noSelfAssign` (#12155),
  `noDescendingSpecificity` (#12014), and `noProto` (#12288, which also drops false
  positives); fewer from `noConfusingVoidType` (#12177), `noTsIgnore` (#12451),
  `noIrregularWhitespace` in CSS strings (#12434), `noDuplicateFontNames` (#12068),
  and `noUnusedVariables`/`noUnusedImports` on Svelte and Vue (#12246, #12280,
  #12124); a corrected `noAdjacentSpacesInRegex` fix (#11563).
- *Newly active through the recommended set:* `useMathMinMax` and
  `useDomNodeTextContent`; `noDuplicateFieldDefinitionNames` on GraphQL files; and
  the six Vue rules and `useQwikLoaderLocation` that Biome recommends for their
  domains, wherever a team's dependencies turn those domains on.
- *Formatter and parser:* CSS-in-JS templates with interpolations are formatted
  (#12212); `return (a, b)` gains parentheses; CSS comment and indentation fixes
  (#11093, #12474); no duplicated comments in spread JSX (#12480); Vue directive
  values and handlers formatted (#12131, #12218), and Vue's `generic` attribute
  parsed (#12124); Svelte (#12393, #12080, #11093) and Astro and HTML parser fixes
  (#12292, #12394).

**`recommended` and `react-recommended`:** the twelve promoted rules Biome recommends
for the React, test, Playwright, React Native, and Drizzle domains run at Biome's
default severity wherever the domain is on — `react-recommended` enables `react`
itself — ten of them at `error`: `noComponentHookFactories`, `noJsxNamespace`,
`useReactAsyncServerFunction`, `noPlaywrightMissingAwait`,
`usePlaywrightValidDescribeCallback`, `noReactNativeRawText`,
`useReactNativePlatformComponents`, `noReactNativeDeepImports`,
`noDrizzleDeleteWithoutWhere`, `noDrizzleUpdateWithoutWhere` (`error`), and
`noReactStringRefs`, `noIdenticalTestTitle` (`warn`). Measured with `react` and
`vitest` declared: five of them, none under 2.5.15, all under 2.6.2. The other four
presets list these rules at `warn`.

**`react-strict`, `react-balanced`, and both `-stable` variants:** the 48 promoted
rules now reach the `-stable` presets at `warn`. `noEmptySource` reports Markdown
holding only blank lines and comments, and empty YAML documents (#12221, #12214;
measured). The listed CSS rules reach SCSS (measured `noHexColors`) and
`useStrictMode` reaches `.gs` files (measured). More from `useArraySortCompare`
(#12249) and the listed type-aware rules (#11854, #12115); more from
`noDuplicateSelectors` (#12014); fewer from `noUnknownAttribute` (#12089),
`noUndeclaredVariables` (#12124), `useConsistentObjectDefinitions` (#12178), and
`useNamingConvention`, whose safe fix stops renaming nested ambient namespaces
(#11888); a corrected `noUselessStringConcat` fix (#12211); `noRestrictedElements`
reaches HTML, Vue, Svelte, and Astro, still inert until configured (#12084).

**`react-strict` and `react-balanced`:** the additions (decision 5) and the rename
(decision 3). More from `noFloatingPromises`, `noMisusedPromises`,
`noUselessTypeConversion`, and `useExhaustiveSwitchCases` (#11093, #11854, #12115);
`useBetterDomTraversing` offers its fix before comments (#12171); corrected
`useTailwindShorthandClasses` fixes (#12401) and Tailwind class parser fixes
(#12185, #12152, #12183, #12174, #12203); listed CSS `nursery` rules reach SCSS
(measured `noUnusedClasses`). **Strict only** (balanced lists them `off`):
`useLogicalProperties` checks physical values and gains a fix (#11953);
`useReactCompiler` analyzes files that export types (#12340);
`noTailwindArbitraryValue` stops reporting arbitrary modifiers (#12194);
`noTailwindRawColors` suggests theme colors and joins the `project` domain (#12272).

**No consumer of this package:** the `tailwind` domain now auto-enables only for
`tailwindcss` 4 (#12291) — no stable Tailwind rule exists, and the presets name
theirs; plugin changes (#12264, #10711, #11713, #11408, #11634) — no preset
configures plugins; the GraphQL assist actions (inactive, decision 10); override
fixes (#12392, #11432) — the presets' only override is a JSON one; the excluded Vue
and Svelte additions; and tooling-only changes — `init`, the `migrate`
subcommands, `inspect`, `rage`, `search`, profiling, the daemon, Android packages,
and performance work.

### 17. Configuration migrations, previewed

Measured with 2.6.2 against copies of the current files: for the two recommended
presets, both `-stable` variants, and the root `biome.json`, `biome migrate` proposes
only the `$schema` rewrite. For each parent it also relocates the same 50 promoted
rules, values unchanged, and renames `useSortedClasses`. It does not remove
`gritMetavariables`, drop the two redundant entries, or add anything. Every proposed
rewrite is adopted — the `$schema` one by decision 15's step 2, the relocations and
rename by hand and checked against migrate's output entry by entry. The two things
migrate does not do are this design's decisions 2 and 8. After step 2, migrate must
report every file up to date.

### 18. The dependency range is this change's; the other bumps are not

The standing requirement advances "the declared dependency range" with the target,
so this change owns `package.json`'s `@biomejs/biome` line (`^2.5.15` → `^2.6.2`)
and the lockfile's matching importer and `@biomejs/*` package entries. The working
tree already holds them beside the unrelated bumps, which land in their own commit.
`pnpm install --frozen-lockfile` must accept the result, because CI installs with
`pnpm ci`.

### 19. The changeset

`minor`: both parents' rule lists change. Written directly as
`.changeset/upgrade-biome-2-6-2.md`, so nothing is committed before review. It leads
with the requirement: **all six presets need Biome 2.6.2 or later** — 2.6.0 and 2.6.1
carry the same code but published no platform binaries, so neither runs from npm —
and 1.20.0 does not load under 2.6. Then the team settings that
stop loading and the `biome migrate --write` that fixes most of them. Then the files
2.6 newly formats, with front matter protected and one recipe for keeping Biome off
Markdown, YAML, or `pnpm-lock.yaml` (`files.includes` negations). Then, by reach:
what the recommended presets newly run, the 48 promoted rules the `-stable` presets
gain, and the parents' 27 additions with their levels, the five relaxations and
their grounds, the rename, and the two entries that leave the lists. It warns about
`noTailwindLegacyUtilities`' fix outside Tailwind v4, names the 23 left out and why,
gives the counts from decision 12, and lists the inherited rule changes from
decision 16. Like the 1.20.0 entry, it cites no Biome pull-request numbers.

## Constraints check

- **The shared intent records no constraints.** It lists those considered and ruled
  out with the originator: keeping teams' own additions and overrides working,
  updates starting to fail teams' checks, security or compliance review, lint run
  time, deadlines, and dependencies on other teams. The design treats none as a
  constraint. The version requirement, the team settings that stop loading, and the
  newly formatted files are disclosed, not prevented. Decision 9 protects files,
  not checks: it keeps the README's own workflow from damaging them.
- **The standing `linter-rule-coverage` requirements apply**, one of them modified by
  this change's delta (decision 6). Tracking `latest` with the range and a snapshot
  regeneration (decisions 1, 15, 18); per-hop audit (decision 1); graduation,
  rename, and redundancy (decisions 2, 3); in-scope and out-of-scope rules derived
  from metadata, with the ledger (decisions 4, 6, 7); the severity convention,
  gating, and analysis scope (decisions 4, 5); new options only against an upstream
  default (decisions 9, 10); the behaviour audit (decisions 3, 16); README inventory
  (decisions 12, 13); release sizing (decision 19). Requirements with nothing to act
  on are recorded in decision 4.
- **The `-stable` variants.** The shared intent names no constraint for them. They
  gain the 48 promoted rules, which are no longer experimental, so a team that chose
  a `-stable` preset to avoid experimental rules still avoids them.

## Risks / Trade-offs

- [A team upgrades the package but not Biome, or Biome but not the package, and no
  preset loads] → The changeset and the README lead with the pairing, measured in
  both directions; `biome migrate --write` fixes the team's own settings.
- [CI starts failing on Markdown, YAML, SCSS, or `pnpm-lock.yaml` formatting once a
  team is on Biome 2.6] → Biome's default whatever the preset; the changeset gives
  the exclusion recipe.
- [A `react-strict` team without Tailwind v4 runs `biome check --write`, and
  `noTailwindLegacyUtilities`' safe fix rewrites class names such as Bootstrap's
  `flex-grow-1`] → Balanced turns the rule off, and the changeset names the hazard
  and the override. Rejected: reclassifying the fix as unsafe in strict. No preset
  sets fix applicability, and adding that surface is a decision of its own.
- [`recommended` and `react-recommended` teams meet `error`-level diagnostics from
  promoted domain rules] → Disclosed with the by-category override the README FAQ
  shows.
- [`-stable` teams meet 48 rules new to them at `warn`] → Disclosed; the rules are
  stable now, which is what those teams opted into.
- [The `frontmatter` setting diverges from Biome's default, and becomes redundant if
  Biome flips it] → It is named in the README's Defaults, so the next pass's option
  audit sees it.
- [The repository's Markdown drifts unformatted] → Nothing that reads it depends on
  Biome's formatting, and the README counts are checked by `check:presets`.
- [The balanced levels rest on fixtures, not a corpus] → The fixtures cover each
  rule's documented forms and the idioms that decide noise; the tasks re-run them
  before the changeset repeats their claims.
- [This change's dependency edit sits in a working tree with unrelated bumps] →
  Decision 18's verification limits this change's dependency diff.

## Migration Plan

Teams upgrade the package together with Biome 2.6, then run `biome migrate --write`
on their own configuration. Teams that stay on Biome 2.5 stay on the previous minor,
which does not load under 2.6. Rollback is a package revert — the presets are data
files with no build step.
