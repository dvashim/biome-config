# Design

## Context

See `proposal.md` — Why and What Changes. The current state that shapes the
approach, all observed on 2026-11-10:

- **Three versions are in play.**
  - The presets, `biome.json`, the README, and `audit/rule-metadata.json` (607 rules)
    pin **2.6.2**.
  - `package.json` declares `^2.6.2`, but a Dependabot lockfile-only bump (#229)
    resolves the installed binary to **2.6.5**.
  - npm `latest` is **2.6.6**, published 2026-11-06.
  - In this split state, `check:rule-metadata` verifies against a fetched 2.6.2.
- **The working tree is not clean.** It holds the switch from the `intent-first`
  schema to `spec-driven`, which:
  - deletes the schema fork, `docs/intents/`, and `docs/adr/`;
  - rewrites `CLAUDE.md`'s OpenSpec and conventions sections;
  - regenerates the `.claude/` OpenSpec assets;
  - removes the ADR references from `scripts/sync-rule-metadata.ts`'s comments.

  It also holds `packageManager` pnpm 12.18.0 with its lockfile changes, and an empty
  stale change directory, `openspec/changes/cover-markdown-and-yaml/`. None of this
  belongs to this change. This change's `CLAUDE.md` edits build on the rewritten
  version.
- **The evidence below came from scratch copies, never the repository.**
  - The rule audit compares the `configuration_schema.json` of the five npm tarballs,
    2.6.2 through 2.6.6.
  - A repository copy with its pins moved to 2.6.6 was swept by the project's own
    `scripts/sync-rule-metadata.ts`: 767 rules, 78 s with 2.6.6 fetched. The copy was
    then checked by `scripts/check-presets.ts`. The only failures were the 69 rules
    awaiting classification and the README's version references.
  - Fixtures ran in scratch directories against the 2.6.6 binary.
- **`nursery` grew past 256 rules.** The category held 121 rules in 2.6.2, 154 in
  2.6.3, 184 in 2.6.4, **269** in 2.6.5, and 281 in 2.6.6 (decision 8).

## Goals / Non-Goals

**Goals:**

- Bring the pinned target, the snapshot, the declared range, and the installed
  binary to 2.6.6, so that every check reads 2.6.6 from the installed binary
  without fetching anything.
- Settle each addition's level on recorded evidence, and record what 2.6.3–2.6.6
  change in rules and output the presets already activate.
- Keep `pnpm run check` meaningful under 2.6.6: the checker classifies SCSS, and the
  ledger accounts for the one rule its metadata misfiles.
- Record the outcome of every audit the standing requirements name, the empty ones
  included.

**Non-Goals:**

- **A review of options on rules the presets already list.** 77 of the 313 listed
  rules accept options and 6 set them. Reviewing them is a policy change that moves
  diagnostics for every consumer independently of the Biome bump, so it gets its
  own change and its own release.
- **Option blocks for the additions.** All 70 land as bare severity strings
  (decision 6). The one possible exception is the conditional
  `noExcessiveNestedBlocks` finding in decision 5.
- **Fix-applicability overrides**, for example demoting `useTailwindVariablesShorthand`'s
  safe fix. No preset sets fix applicability; the 2.6.2 pass declined the same
  surface for `noTailwindLegacyUtilities`.
- **A `peerDependencies` floor on `@biomejs/biome`.** Earlier passes deferred it,
  and it remains its own change.
- **Landing the working-tree tooling changes or deleting the stale
  `cover-markdown-and-yaml` stub.** Both are `dev-tooling-currency` work.
- **README highlights for every addition.** The highlights are curated. Only the
  three rule families new to the presets get an entry (decision 11).

## Decisions

### 1. The audit is four hops, and every hop adds rules

| Hop | Published | Added (in scope / Vue / Svelte / YAML) | Removed | Moved | Option changes | Other settings | `nursery` |
|---|---|---|---|---|---|---|---|
| 2.6.2 → 2.6.3 | 10-24 | 33 (25 / 7 / 1 / 0) | 0 | 0 | 0 | `linter.domains.tanstackQuery`, top level and in `overrides` | 121 → 154 |
| 2.6.3 → 2.6.4 | 10-28 | 30 (7 / 21 / 1 / 1) | 0 | 0 | 0 | none | 154 → 184 |
| 2.6.4 → 2.6.5 | 11-04 | 85 (27 / 56 / 2 / 0) | 0 | 0 | `noTailwindRawColors.allowBlackAndWhite` | none | 184 → 269 |
| 2.6.5 → 2.6.6 | 11-06 | 12 (11 / 0 / 1 / 0) | 0 | 0 | 0 | none | 269 → 281 |

- **Method.** The same as the 2.6.2 pass: each tarball's `configuration_schema.json`
  is compared rule by rule on fully resolved fragments, with descriptions stripped
  and one-value enums read as constants.
- **No transient rule.** No hop removes or moves a rule, so no rule appeared and
  vanished within the range. The union of the hops is the endpoint diff, and that
  agreement is the per-hop check's recorded outcome.
- **The scratch sweep agrees.** Against the committed snapshot it shows:
  - 160 added entries, none removed, and no category move;
  - one changed existing entry: `useLogicalProperties`'s languages go from `css` to
    `css`, `scss`;
  - no existing rule changes default severity, recommended status, or domains.

### 2. Scope: 70 additions in, 90 out

| Bucket | Count | Rules |
|---|---|---|
| Domainless JavaScript/TypeScript | 47 | see the level table in decision 5 |
| Dependency-gated domains | 10 | Playwright: `noPlaywrightNthMethods`, `noPlaywrightUnsafeReferences`; TanStack Query: `noTanstackQueryRestDestructuring`, `noTanstackQueryVoidQueryFn` (also `types`), `useTanstackQueryInfiniteQueryPropertyOrder`, `useTanstackQueryStableQueryClient` (also `react`); test: `useExpectToContain`; Next.js: `useNextScriptForGoogleAnalytics`; React Native: `useReactNativeValidPlatformColors`; Tailwind: `useTailwindVariablesShorthand` |
| `types` only | 2 | `noUnsafeReturn`, `noUselessTypeAssertion` |
| CSS | 5 | `noPseudoElementInFunctionalPseudoClass`, `noSelfNestedLayer`, `noShortTimeValues`, `noZeroLengthUnit`, `useConsistentLightnessNotation` |
| `package.json` | 4 | `usePackageJsonCpu`, `usePackageJsonEngines`, `usePackageJsonValidCpu`, `usePackageJsonValidEngines` |
| SCSS | 1 | `noMissingScssInterpolation` (decision 3) |
| Ledger, direction `in` | 1 | `useConsistentUnicodeBom` (decision 4) |
| **Out**: Vue-only domain | 84 | excluded by their domains, with no ledger entry |
| **Out**: Svelte-only domain | 5 | `noSvelteInternal`, `useSvelteEventDispatcherTypes`, `noSvelteBindValueOnCheckableInputs`, `useSvelteStoreInitialValue`, `noSvelteIgnoredUnsubscribe` |
| **Out**: YAML | 1 | `noYamlBooleanKeys`, excluded by its examples |

- **`tanstackQuery` is a new domain.** It is neither excluded nor named in clause
  (a). Its four rules qualify through their `js`, `ts`, and `jsx` examples, as the
  disjunction requires, and the delta adds `tanstackQuery` to the requirement's
  list of unnamed domains.
- **Recommended status changes nothing.** 35 of the 70 report themselves as
  recommended, but all are `nursery`, so none is redundant. The redundancy, graduation, rename, and removal
  requirements have nothing to act on.
- **Dependency-based suppression has nothing to act on.** None of the 60 additions
  outside a dependency-gated domain documents suppression based on declared
  dependencies (scanned in each one's `biome explain` output).

### 3. SCSS enters the scope through the spec and the checker

- **The gap.** Biome tags SCSS examples `scss`, which is in neither
  `IN_SCOPE_LANGUAGES` nor `EXCLUDED_LANGUAGES`. Coverage therefore reports
  `noMissingScssInterpolation` as awaiting classification (measured). By the code
  of the listed-rule scope check, the rule would fail that check once listed.
- **The change.** `IN_SCOPE_LANGUAGES` gains `scss`, and the delta adds `scss` to
  clause (a) with a scenario for a rule documented only in SCSS.
- **Why SCSS is in.**
  - Biome 2.6 lints and formats `.scss` for every consumer.
  - Listed CSS rules already report there: the 2.6.2 pass measured `noHexColors`
    and `noUnusedClasses`, and `useLogicalProperties` now documents SCSS.
  - The rule catches a real defect: a Sass variable written into a custom property
    without `#{}` reaches the browser as the literal text `$gap`.
- **Rejected:**
  - excluding SCSS beside GraphQL, Markdown, and YAML, which would withhold a
    correctness rule for files the presets already process;
  - a ledger entry, because the metadata does classify the rule and every later
    SCSS rule would need one.
- **Analysis scope.** The standing requirement applies, because whether a call
  needs `#{}` depends on whether it is a Sass function. The rule reads only the
  current file. Its documentation says it does not report a call it cannot resolve,
  such as `bpx($size)` or a function brought in by `@use … as *`. It under-reports
  rather than reporting correct code. The cross-file fixture confirms this (decision
  5, task 5.4): `bpx(4px)` from another file is silent, while `$gap` and
  `math.div(8px, 2)` are reported.
- **Level:** `warn` in both presets. Biome's own default is `error`.

### 4. `useConsistentUnicodeBom` is recorded in scope in the ledger

- **The evidence.**
  - Its only examples are Markdown, so the snapshot files it under `md`. Coverage
    excludes it, and listed-rule scope would flag it once listed.
  - Run alone at `warn` under 2.6.6, it reports a leading byte order mark in `.js`,
    `.ts`, `.css`, `.json`, `.html`, and `.md` files (measured).
  - Its release note (#12113) lists JavaScript, TypeScript, JSON, CSS, GraphQL,
    HTML, and Markdown.
- **The decision.** The rule gets a ledger entry with direction `in`, under the
  existing "documented only in an excluded language" scenario, as `noEmptySource`
  did.
- **Rejected:** omitting it, since it reports every file type the presets cover.
- **Level:** `warn` in both presets, with its default `bom: "never"`. Its fix is
  safe: it removes the mark.

### 5. Levels

**What a probe showed.** A scratch fixture with `react` 19 declared ran each
uncertain rule alone at `warn`:

| Rule | Reported | Silent |
|---|---|---|
| `noSyncMethods` | `flushSync(() => …)` from `react-dom`; `readFileSync` at module level; `execSync` inside a function; `existsSync` | — |
| `noNull` | `return null` in a component; `useState<string \| null>(null)` | `useRef<HTMLDivElement>(null)` |
| `noArrayForEach` | `a.forEach((x) => …)`, beside `noForEach`; `a.forEach((x, i) => …)`, alone | — |
| `noDanglingUnderscore` | `const _unused`; `user._id` | parameters and destructured names (documented) |
| `noDynamicDelete` | `delete obj[key]`, which `noDelete` does not report | `delete obj.fixed`, which `noDelete` reports |
| `noMapSpread` | — | `todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))`; `todos.map((t) => ({ ...t, selected: true }))` |
| `noUnsafeReturn` | `return JSON.parse(text)` | `return r.json()` after `await fetch(u)` |
| `useBlockStatementOverIife` | — | an async IIFE inside `useEffect` |
| `noShortTimeValues` | — | `animation-duration: 0.01ms` in a reduced-motion block: the rule has no `minimum` and does nothing until one is set |
| `useIteratorZip` | — | an index loop over two arrays (shape not matched). `Iterator.zip` is `undefined` in Node 26.13 |

**Re-run against the final presets (task 5.1).** The same sources, extending copies
of the built `react-strict` and `react-balanced` (`vcs.enabled: false`, `react` 19
declared):
- `react-strict` reproduces every row above: the same 14 diagnostics at the same
  positions.
- `react-balanced` reports only `noForEach`, `noDynamicDelete`, `noDelete`, and
  `noUnsafeReturn` from these sources. The four relaxed rules among them are
  silent.

**The levels.**

| Rule | strict | balanced | Ground |
|---|---|---|---|
| `noArrayForEach` | warn | **off** | Reports every `forEach` callback. The listed `noForEach` already reports those that ignore the index, so balanced code would get two diagnostics for one call. Balanced keeps `noForEach`, which allows index-using callbacks |
| `noDanglingUnderscore` | warn | **off** | Reports `user._id` and `_`-prefixed variables. A leading underscore is a naming convention, and balanced already loosens `useNamingConvention` |
| `noNull` | warn | **off** | Reports React's own `return null` and nullable state |
| `noSyncMethods` | warn | **off** | Reports React DOM's `flushSync`, and every `*Sync` call in Node scripts and configuration files, including inside functions. `allowAtRootLevel` would exempt only top-level calls |
| `useIteratorZip` | warn | **off** | Suggests `Iterator.zip()`, which Node 26.13 does not provide. Following it breaks code wherever no polyfill runs |
| `usePackageJsonCpu` | warn | **off** | Requires a `cpu` field in every `package.json`. Only packages that ship native binaries declare one |
| `usePackageJsonEngines` | warn | **info** | Requires an `engines` field. Declaring one is sound practice for a published package, but a private app's manifest needs none |
| `noPlaywrightNthMethods` | warn | **off** | Reports `.first()` and `.last()` on any object: Cheerio selections and Immutable lists in a project without Playwright (gate test below) |
| `useNextScriptForGoogleAnalytics` | warn | **off** | Next.js rule. It reports a Google Analytics `<script>` in a plain React component and recommends Next.js' own component, as `noImgElement` fires on any `<img>` (gate test below) |
| `useTailwindVariablesShorthand` | warn | **off** | Suggests Tailwind v4's `bg-(--x)`, and its **safe** fix rewrites `bg-[var(--x)]` to it; a Tailwind v3 project loses the style. Measured: the rule does not check the Tailwind version (task 5.3) |
| the other 60 | warn | warn | Each reports its documented pattern |

**Kept at `warn` in balanced despite the first hints:**

- `noDynamicDelete` complements `noDelete` rather than duplicating it, and balanced
  keeps `noDelete` at `warn`.
- `noMapSpread`'s defaults (`ignoreArgs`, `ignoreRereads`) leave the
  immutable-update idioms alone.
- `noUnsafeReturn`'s report is resolved by an `as T`, which balanced already
  permits by turning `noUnsafeTypeAssertion` off.
- `noShortTimeValues` is configuration-required, so the standing requirement lists
  it at a bare `warn` in both presets.

**Gate tests (task 5.2).** The same sources ran in eight directories, each
extending the built `react-strict`:
- `react` 19 alone;
- `react` 19 plus, respectively: `@playwright/test`, `@tanstack/react-query`,
  `vitest`, `next`, `react-native`, `tailwindcss` 3, and `tailwindcss` 4.

Every rule reported identically in all eight. **Explicit listing defeats all ten
gates**, so each reaches every consumer of the parents. Noise therefore turns on
what the trigger matches outside the framework:

| Rule | Outside its framework | Level |
|---|---|---|
| `noPlaywrightNthMethods` | reports Cheerio's `$('li').first()` and `.last()`, and Immutable's `list.first()` and `list.last()`: 4 reports in a file with no Playwright | balanced **off** |
| `noPlaywrightUnsafeReferences` | reports a Puppeteer `page.evaluate` closing over an outer variable. This is accurate, because Puppeteer also runs the callback in the page | warn / warn |
| `noTanstackQueryRestDestructuring` | silent on rest destructuring of Apollo's `useQuery`, and of a `useQuery` imported from a local module: keyed to the TanStack import | warn / warn |
| `noTanstackQueryVoidQueryFn` | reports a `queryFn` that returns no data even in a `useQuery` imported from a local module. Not keyed to the import, but its trigger is TanStack's own `queryFn` option, and Apollo's `useQuery` takes none | warn / warn |
| `useTanstackQueryInfiniteQueryPropertyOrder` | silent on the same `useInfiniteQuery` call imported from a local module: keyed to the TanStack import | warn / warn |
| `useTanstackQueryStableQueryClient` | silent on a `new QueryClient()` imported from a local module: keyed to the TanStack import | warn / warn |
| `useExpectToContain` | trigger is a test framework's `expect(…).toBe(…)` | warn / warn |
| `useNextScriptForGoogleAnalytics` | reports a Google Analytics `<script>` in a plain React component and points to Next.js' component. Silent on the same script in `index.html` | balanced **off** |
| `useReactNativeValidPlatformColors` | trigger is `PlatformColor` imported from `react-native` | warn / warn |
| `useTailwindVariablesShorthand` | trigger is Tailwind's arbitrary-value syntax, reported under `tailwindcss` 3 too. With 3.4.17 declared, `biome check --write` rewrote `bg-[var(--brand)]` to `bg-(--brand)` and `hover:bg-red-500/[var(--opacity)]` to `hover:bg-red-500/(--opacity)`: v4-only syntax, so the v3 styles are lost (task 5.3) | balanced **off**; the strict hazard goes in the changeset |

**Cross-file fixtures (task 5.4).** Each rule ran with its definitions in another
file of the same project, beside a control it must report:

| Rule | Reported | Silent |
|---|---|---|
| `noMissingScssInterpolation` | `--plain-variable: $gap`; `--builtin-call: math.div(8px, 2)` after `@use 'sass:math'` | `--from-other-file: bpx(4px)`, a function from `_fns.scss` brought in by `@use 'fns' as *`; `#{$gap}` |
| `noUnsafeReturn` | `return JSON.parse(text)` | returning an imported, concretely typed constant, or an imported function's result; returning an import from an unresolvable package (no `node_modules`) |
| `noUselessTypeAssertion` | its three documented forms; `load()!` on an imported function whose declared return type is not nullable, so cross-file resolution works | `value as string` narrowing an imported `string \| number`; `as string` on an import from an unresolvable package |

None of the three reports correct code because a definition lives in another file.
The SCSS rule under-reports instead, as its documentation says. The type-aware
rules resolve in-project imports, and treat an unresolvable import as unknown
rather than `any`. None publishes an option to declare external names, and none
needs one, so the analysis-scope ground for a balanced relaxation does not apply.
All three keep `warn` in both presets.

**CSS nesting (task 5.5).** `noExcessiveNestedBlocks` reports nothing on CSS in
2.6.6, under the built `react-strict`:
- four selector levels, with and without the `@layer` wrapper;
- five selector levels;
- five nested at-rules (`@layer`, `@media`, `@supports`, `@container`, `@media`).

The JavaScript control, five nested `if` statements, is reported. The rule's
documentation never mentions CSS, although its schema describes `ignoreAtRules` as
CSS-only. The `@layer` interaction this design anticipated therefore cannot arise
under 2.6.6, and no option is set. If a later release starts reporting CSS, the
release notes will show it, and that pass re-measures the interaction.

**Cost (task 5.6).** The corpus is synthetic: 1,600 files, 200 self-contained
copies of the fixture sources with relative imports intact, under the built
`react-strict` with `react` and `@tanstack/react-query` declared. `biome lint` ran
nine alternating times with the three type-aware additions on and turned off. The
"on" runs report exactly the 1,200 extra diagnostics the three rules produce.
- Median wall time: 716 ms on, 711 ms off, a difference of 5 ms (0.8%), within
  run-to-run noise.
- Biome's own timing: 506 ms on, 501 ms off.

The three rules add no measurable time on top of the type-inference engine the
listed `types` rules already run. The population that pays is every consumer of
the parents: `types` is not dependency-gated, and `noTanstackQueryVoidQueryFn`
defeats its gate (above).

**In strict,** `noArrayForEach` and `noForEach` both report a `forEach` that
ignores its index. Strict is opt-in-maximal, so the duplication stands and the
changeset names it.

**What the fixture tasks settle.** These levels are where the change starts. Before
the changeset repeats a level, the fixture tasks confirm it or overturn it, and a
fixture result that contradicts a ground reverses that level:

- **The probe**, re-run against the final presets.
- **Gate tests** for the ten domain rules, as the standing requirement demands. Each
  rule runs against fixtures with no dependency, and with `@playwright/test`,
  `@tanstack/react-query`, `vitest`, `next`, `react-native`, and `tailwindcss` 3 and
  4 respectively. A rule that defeats its gate and reports on code outside its
  framework is relaxed in balanced. Examples of such code:
  - `.first()`, `.last()`, or `.nth()` on non-Playwright objects, for
    `noPlaywrightNthMethods`;
  - a Google Analytics `<script>` in a non-Next React app, for
    `useNextScriptForGoogleAnalytics`;
  - Tailwind 3, for `useTailwindVariablesShorthand`.

  A rule whose trigger is specific to its framework keeps its level.
- **Cross-file fixtures** for the rules whose reports depend on resolving a
  definition: `noMissingScssInterpolation`, and the type-aware `noUnsafeReturn` and
  `noUselessTypeAssertion`. For the type-aware rules, an imported value's type must
  resolve, or the rule must stay silent.
- **CSS nesting for `noExcessiveNestedBlocks`.** Its `ignoreAtRules` option
  "only applies to CSS" and is unset, so every at-rule block counts as a level. If
  the `@layer` wrapper that strict's own `useLayeredStyles` demands pushes ordinary
  nesting past the default `max` of 4, the preset itself creates the violation.
  Strict then sets `ignoreAtRules: ["layer"]`, the one option this change would
  adopt under the standing options requirement.
- **Cost.** `biome lint` is timed with and without the three type-aware additions
  (`noUnsafeReturn`, `noUselessTypeAssertion`, `noTanstackQueryVoidQueryFn`). They
  run on the type-inference engine the 20 listed `types` rules already use.

### 6. The option audit

| Option | Reach | Default | Outcome |
|---|---|---|---|
| `noTailwindRawColors.allowBlackAndWhite` (2.6.5) | strict `warn`, balanced `off` | `true`: `black` and `white` stay allowed, as before the option existed | not set |
| `noExcessiveNestedBlocks.max`, `.ignoreAtRules` | addition | `4`; unset | not set: in 2.6.6 the rule reports nothing on CSS, so `ignoreAtRules` has nothing to exempt (decision 5, task 5.5) |
| `noMapSpread.ignoreArgs`, `.ignoreRereads` | addition | `true`, `true` | not set: the defaults exempt the idioms balanced cares about |
| `noShortTimeValues.minimum` | addition | none; the rule is inert | not set: a configuration-required rule |
| `noSyncMethods.allowAtRootLevel`, `.ignore` | addition | `false`, `[]` | not set: balanced turns the rule off instead (decision 5) |
| `useConsistentLightnessNotation.notation` | addition | `"percentage"` | not set |
| `useConsistentUnicodeBom.bom` | addition | `"never"` | not set |
| `useObjectFromEntries.functions` | addition | `[]` | not set |

The other 63 additions take no options (schema).

### 7. Settings outside the rules: the new requirements' first application

- **`linter.domains.tanstackQuery` (2.6.3).** This is the only new setting. Biome
  enables a domain's recommended rules when it detects the domain's dependency, and
  none of the four TanStack Query rules is recommended, so the domain contributes
  nothing by default. The presets set no `domains` except `react-recommended`'s
  `react`. **Not set.**
- **No changed default** among the settings the presets set. The 2.6.6 schema still
  describes `markdown.parser.frontmatter` as defaulting to `false`, so the
  protective `true` stays.
- **Not a setting.** Biome's protection of `pnpm-lock.yaml` (2.6.4) is a built-in,
  and decision 9 acts on it.
- **Why the requirements land in this change.** `docs/adr/0002` held the policy, and
  the switch to `spec-driven` retires it. Under that schema a change's decisions
  live in its `design.md`, and standing behaviour lives in the spec.

### 8. The 2.6.5 rule-index overflow and the 2.6.6 floor

- **The bug.** 2.6.5 stores a rule's position within its group in a `u8` (fixed in
  2.6.6 by #12986). With 269 `nursery` rules, positions 256–268 alias positions
  0–12. Configuring one of those 13 rules configures another: biome#12954 reports
  that enabling `useWhileLoopCondition` enables `noDanglingUnderscore` instead. The
  13 are 12 Vue rules and `useWhileLoopCondition`.
- **1.21.0 is unaffected.** It lists none of the 13, so its configuration does not
  misapply under 2.6.5.
- **After this change, 2.6.5 is unusable anyway.** The parents list
  `useWhileLoopCondition` and 11 rules first declared in 2.6.6, so under 2.6.5
  (and 2.6.3 and 2.6.4) they fail on unknown keys before any rule runs. The floor
  is 2.6.6 by construction, and the overflow is a second reason not to trim the
  list to support 2.6.5.
- **Measured in tasks:**
  - the parents under 2.6.5;
  - the other four presets under 2.6.2 and 2.6.5. They gain no key 2.6.2 lacks;
    whether a newer `$schema` URL matters is what the run shows.
- **The README's Requirements row says `2.6.6+`,** the documented target, whatever
  the four other presets tolerate.

**Measured (task 6.1).** Each preset was extended by a minimal project
(`vcs.enabled: false`, one `.js` file):

| | 2.6.2 | 2.6.5 | 2.6.6 |
|---|---|---|---|
| `react-strict`, `react-balanced` | exit 1: 70 `Found an unknown key` errors, one per addition | exit 1: 11 unknown keys, exactly the in-scope rules 2.6.6 first declares (`noArrayMethodsOnArguments` …) | load, exit 0 |
| the other four | load, exit 0, with one information notice | load, exit 0, with the same notice | load, exit 0, no notice |

The notice reads "The configuration schema version does not match the CLI version"
and points at the preset's `$schema`. It is informational and fails nothing. The
four other presets therefore keep working on 2.6.2–2.6.5, and the changeset says
so beside the parents' requirement.

### 9. The root `biome.json` and the repository's own checks

- **The lockfile.** 2.6.4 (#12664) protects `pnpm-lock.yaml` from processing, so
  `"!pnpm-lock.yaml"` leaves `files.includes`. A task confirms that `check:format`
  stays green without it and that the lockfile is untouched.
- **Markdown.** `!**/*.md` stays: archives, generated assets, `CHANGELOG.md`, and the
  README are still not Biome's to reformat.
- **Workflows.** The YAML formatter is unchanged in these releases, so the two
  workflow files keep their 2.6.2 formatting; `check:format` confirms it.

### 10. Resulting counts

| | today | after |
|---|---|---|
| `react-strict` / `react-balanced` listed | 313 | **383** |
| … a11y / complexity / correctness / nursery | 8 / 22 / 31 / 85 | 8 / 22 / 31 / **155** |
| … performance / security / style / suspicious | 11 / 5 / 92 / 59 | unchanged |
| `-stable` variants listed | 228 | 228 |
| balanced relaxations | 33 | **43** |
| … in stable categories (reach `react-balanced-stable`) | 15 | 15 |
| … in nursery | 18 | **28** |
| rules in the snapshot | 607 | **767** |
| ledger entries | 2 | **3** |

The relaxation figures follow decision 5's levels. A level the fixtures overturn
moves them, and `check:presets` holds the README to whatever the presets list.
These are the final figures (task 5.7). The gate tests added
`noPlaywrightNthMethods` and `useNextScriptForGoogleAnalytics` to the eight
relaxations this design started with, and no other fixture overturned a level.
Of the 70 additions, balanced lists 60 at `warn`, 1 at `info`, and 9 `off`.

### 11. README edits, inside the matchers' constraints

**Edits the matchers check:**

- The seven version references, and the Requirements row as `**2.6.6+**`.
  Historical mentions such as "Biome 2.5.0" stay.
- `up to 313 explicitly configured rules` → 383.
- The Configurations table:
  - React strict: `383` / `155`;
  - React balanced: `383, 43 relaxed` / `155`;
  - the `-stable` rows are unchanged.
- `nursery (85 rules)` → 155.
- `**33 targeted relaxations**` → 43, and `of the 33 relaxations` → 43.
- Ten `nursery` rows in alphabetical position, each giving decision 5's ground in
  one line.

**Edits no matcher reads, so they are edited by hand and checked by grep:**

- the React strict sentence's `**313 rules**`;
- the nursery note's list of relaxed rules, which gains the ten;
- "the eighteen nursery relaxations" in the balanced-stable section, which becomes
  "twenty-eight".

A hook name in backticks, such as `useQuery`, reads to the rule-name matcher as a
rule `react-strict` does not list, and fails the check. Prose that names one writes
it as a call, `useQuery()`.

**Prose:**

- **The scope sentence.** "JavaScript/TypeScript/JSX, CSS, HTML, JSON" gains SCSS.
  The omitted-rules sentence is unchanged.
- **Highlights**, for the three families new to the presets:
  - a TanStack Query bullet naming its four rules, whose text states the gate result
    decision 5 measures;
  - `noMissingScssInterpolation` under Styling;
  - the `package.json` field rules.

  `check:presets` verifies that every name exists in `react-strict`.

**Constraints, as in earlier passes:**

- no number directly after an em dash, except the `-stable` totals the
  `— (\d+) rules` matcher reads;
- `up to N explicitly configured rules` stays unique;
- no bolded version other than the target.

### 12. `CLAUDE.md` and the checker's comments

**`CLAUDE.md`:**

- The scope bullet gains `scss`.
- The framework-rules sentence gains TanStack Query.
- The listed-rule-scope paragraph's list of unnamed domains gains `tanstackQuery`.
- The ledger paragraph names three entries, adding `useConsistentUnicodeBom`.
- The root-configuration paragraph drops the lockfile clause, because Biome protects
  pnpm lockfiles by itself since 2.6.4.
- The sweep and check timings ("~6s", "about 24 s instead of 11 s") are re-measured
  at 767 rules and updated if they moved.

  **Measured (task 2.5), and updated.** On a 10-core machine:
  - all 767 `biome explain` calls with 10-way parallelism take 28.6 s;
  - `check:rule-metadata` against the installed binary takes 27.5 s and 28.5 s;
  - in the split state, with a cached `pnpm dlx` fetch of 2.6.6, it takes 85.3 s
    and 80.8 s.

  Most of the rise is not the 160 added rules. Every 2.6.6 process starts in about
  0.19 s (`--version`, `explain`, and `format --stdin` alike), where 2.6.2's
  started in 0.01 s on the same machine and under the same load. The load average
  was high (8–20) throughout, so the absolute figures are upper bounds; the
  startup ratio was measured on both binaries side by side.

**In `scripts/check-presets.ts`,** the comments above `IN_SCOPE_LANGUAGES` and the
unnamed-domain list change to match.

### 13. Order of operations

1. **Confirm the starting state and set the dependency range.** `^2.6.6` and
   `pnpm install`, so the installed binary is 2.6.6. Then record which lockfile
   hunks are this change's.
2. **Advance every pin in one step,** so the repository's configuration and pins
   agree:
   - `$schema` in the six presets and `biome.json`;
   - the README version references;
   - the root `files.includes` lockfile clause, which is dropped.
3. **Regenerate the snapshot.** `pnpm sync-rule-metadata` sweeps the installed 2.6.6
   with no fetch and records 767 rules. Its diff must be decision 1's.
4. **Teach the checker the new scope.** Add `scss` to `IN_SCOPE_LANGUAGES` and the
   `useConsistentUnicodeBom` ledger entry. `check:presets` then reports only the 69
   rules awaiting classification and the README.
5. **List the 70 at decision 5's levels.**
   - `biome check --write` orders the new entries under the `useSortedKeys` assist.
   - `pnpm sync-stable` changes only the `$schema` in the `-stable` files.
   - `check:presets` then reports only the README.
6. **Run the fixtures** against the built presets, re-level wherever the evidence
   requires, and run `pnpm sync-stable` again.
7. **Finish:** README, `CLAUDE.md`, the migration preview, the load matrix, the
   changeset, and the full `pnpm run check`.

### 14. Inherited behaviour, grouped by the consumers it reaches

From the 2.6.3–2.6.6 release notes. Each item is placed using the snapshot's
category and recommended data and the preset listings.

**All six presets:**

- *Formatter, TypeScript:*
  - parentheses are kept around instantiation expressions and their operands
    (#12536, #12540, #12496);
  - around a `new` callee holding a dynamic `import()` (#12598);
  - around an optional chain followed by `!`, type arguments, or more parentheses
    (#12745).

  Each previously produced code that changed meaning or did not parse.
- *Formatter, Markdown*, about fifteen fixes:
  - blank lines are kept or added between blocks (#12526, #12662, #12758), and runs of
    blank lines collapse (#12762);
  - list and quote nesting (#12576, #12575, #12769);
  - table idempotency (#12607);
  - `proseWrap` handling (#12509, #12754);
  - fenced Markdown's front matter under `frontmatter` with `formatEmbeds` (#12682).
- *Formatter and parser, other languages:*
  - SCSS prints comma-separated multi-value declarations one per line (#12860) and
    parses negative interpolation list items (#12983);
  - GraphQL executable descriptions (#12578);
  - Astro and Svelte keep `<pre>` and `<textarea>` content (#12674);
  - Vue `v-for` defaults are parsed (#12702);
  - GritQL lists (#12787).
- *Files:*
  - `pnpm-lock.yaml` is no longer processed (#12664);
  - `.editorconfig` section globs match correctly (#12708), which reaches the
    formatter because the presets set `useEditorconfig: true`;
  - non-JSON files in editor settings directories are no longer parsed as JSON
    (#12656);
  - `files.includes` exclusions no longer apply above the project root (#12599).
- *Recommended rules, unlisted:*
  - `noInvalidGridAreas` counts cells rather than characters, so it reports
    different rows (#12508);
  - `noShorthandPropertyOverrides` recognizes more overrides (#12640);
  - `noUnknownProperty` checks SCSS nested properties by the name Sass emits, so some
    reports disappear and others appear (#12528);
  - fewer reports from `useDomNodeTextContent` (#12511), `noDescendingSpecificity`
    (#12588), `useMathMinMax` (#12737), and `useGenericFontNames` (#12973).
- *CLI:*
  - the run summary and warnings go to stderr (#12593);
  - not in the notes: each 2.6.6 process starts in about 0.19 s against 2.6.2's
    0.01 s on macOS arm64 (measured, decision 12). That is negligible for one
    `biome check` run or for the editor's long-lived server. It is measurable only
    for tools that start Biome once per file, like this repository's sweep.

**`react-strict`, `react-balanced`, and both `-stable` variants**, through listed
stable rules:

- fewer reports from `noUselessElse` (#12530) and `usePlaywrightValidDescribeCallback`
  (#12821, #12819);
- one diagnostic per repeated title from `noIdenticalTestTitle` (#12534);
- `useNamingConvention`'s `typeMember` selector no longer applies to type parameters
  (#11623);
- a cleaner `useConsistentTestIt` fix (#12639).

**`react-strict` and `react-balanced`**, through listed `nursery` rules:

- the additions (decision 5);
- more reports from `useExhaustiveSwitchCases` and from `noMisusedPromises`, which
  sits at `error` in both presets (#12930);
- fewer from `noBaseToString` (#12652);
- `noMisusedPromises` and `noFloatingPromises` fixes no longer duplicate comments
  (#12443);
- Tailwind class parser fixes (#12898);
- the 2.6.6 configuration fix for groups over 256 rules (#12986, decision 8).

**Strict only,** because balanced lists both rules `off`:

- `useLogicalProperties` reports multi-value physical shorthands, combinable logical
  longhand pairs, and dynamic shorthands, the last without a fix (#12465);
- `noTailwindRawColors` gains `allowBlackAndWhite` (#12786), whose default keeps its
  behaviour.

**`recommended` and `react-recommended`:** nothing beyond the all-six items. No rule
changes recommended status or default severity, and the `tanstackQuery` domain has
no recommended rule.

**No consumer of this package:**

- Vue and Svelte rule changes (#12519, #12543) and the excluded additions;
- plugin changes (#12858, #12868, #12870, #12813), since no preset configures
  plugins;
- `grit` configuration (#12864);
- daemon and language-server fixes (#12501, #12678, #12747);
- the Prettier `bracketSpacing` migration (#12649). Measured (task 6.2): a JSON file
  and a JSONC file with nested inline objects and arrays format byte-identically
  under 2.6.2 and 2.6.6 with the presets' shared formatter settings;
- `useSortedProperties` (#12418, #12415, #12640). Measured (task 6.2): under the
  presets' `assist.actions.preset: "recommended"`, a CSS rule with unsorted
  properties raises no `useSortedProperties` diagnostic, and it raises one once the
  action is switched on, so the probe can see it;
- performance work, binaries (#12692, #12913), and panic reporting (#12746).

### 15. Configuration migrations, previewed

`biome migrate`, run with 2.6.6 and without `--write`, against copies of the six
presets and the root `biome.json`. No hop renames or removes a rule or a setting,
so the expected proposal is only the `$schema` rewrite that step 2 of decision 13
makes. Each rewrite migrate proposes is recorded as adopted or declined. After step
2, migrate must report every file up to date.

**Measured** with the installed 2.6.6 against copies of the 2.6.2-pinned files
(task 2.1): for all seven, the six presets and the root `biome.json`, migrate
proposes exactly one rewrite, `$schema` `2.6.2` → `2.6.6`, and nothing else.
**Adopted**: step 2 of decision 13 makes the same rewrite by hand in the four
hand-maintained presets and `biome.json`, and through `pnpm sync-stable` in the
`-stable` files. Nothing was declined.

### 16. The dependency range is this change's; the other bumps are not

The standing requirement advances "the declared dependency range" with the target.
This change therefore owns:

- `package.json`'s `@biomejs/biome` line (`^2.6.2` → `^2.6.6`);
- the lockfile's matching importer and `@biomejs/*` package entries.

The pnpm 12.18.0 bump and the OpenSpec tooling switch land in their own commits.
`pnpm install --frozen-lockfile` must accept the result, because CI installs with
`pnpm ci`.

### 17. The changeset

`minor`, written directly as `.changeset/upgrade-biome-2-6-6.md`, because
`pnpm changeset` commits on its own. Its order:

1. It leads with the requirement: **`react-strict` and `react-balanced` need Biome
   2.6.6 or later.** 2.6.5 also misapplies nursery configuration past the 256th
   rule.
2. The additions by reach, with their levels.
3. The ten relaxations and their grounds.
4. The strict-only caveats:
   - the `noArrayForEach`/`noForEach` overlap;
   - `useIteratorZip`'s unavailable API;
   - `useTailwindVariablesShorthand`'s safe fix outside Tailwind v4, if the version
     test shows it.
5. The 90 rules left out, and why.
6. The SCSS scope.
7. The counts.
8. Decision 14's inherited changes.

Like the 1.20.0 and 1.21.0 entries, it cites no Biome pull-request numbers.

### 18. Standing requirements, mapped

- Tracking `latest`, with the range and the snapshot: decisions 1, 13, and 16.
- The per-hop audit: decision 1.
- Graduation, rename, removal, and redundancy (nothing to act on): decision 2.
- Scope derived from metadata, with the ledger: decisions 2, 3, and 4, and the
  delta.
- The severity convention, gating, analysis scope, cost, and configuration-required
  rules: decision 5.
- New rule options: decision 6.
- New settings (the delta's added requirements): decision 7.
- The behaviour audit: decision 14.
- README inventory: decisions 10 and 11.
- Release sizing: decision 17.

## Risks / Trade-offs

- [A team on Biome 2.6.2–2.6.5 upgrades the package, and the parents stop loading on
  unknown keys] → The changeset and README lead with the requirement, measured in
  both directions. The other four presets are measured under 2.6.2 and 2.6.5.
- [Strict reports one `forEach` twice] → Disclosed. Strict is opt-in-maximal, and a
  team can switch off either rule by name.
- [`useTailwindVariablesShorthand`'s safe fix rewrites Tailwind v3 classes under
  strict's `biome check --write`] → Balanced turns the rule off, and the changeset
  names the hazard and the override. Rejected: demoting the fix, a surface no preset
  sets (Non-Goals).
- [`useIteratorZip` steers strict code to an API Node 26.13 lacks] → Disclosed. The
  rule's default severity is `info`, and it has no automatic fix.
- [Gate tests show more domain rules firing outside their frameworks] → Those rules
  relax in balanced and the counts move. `check:presets` keeps the README honest.
- [Seventy rules in one release make a large consumer diff] → Each level rests on a
  recorded ground from the established criteria, and the changeset groups rules by
  reach.
- [Widening the scope to SCSS admits every future SCSS-only rule] → This is
  intended. Coverage reports each one for leveling, as it does for CSS.
- [The new-settings requirements land while `docs/adr/0002` is deleted in another
  commit] → Whichever lands first, the policy is never without a record.

## Migration Plan

Teams on `react-strict` or `react-balanced` upgrade Biome to 2.6.6 together with the
package. Teams on the other four presets follow the README's `2.6.6+`, and the
changeset reports what the load matrix measured for older 2.6 releases. Rollback is
a package revert: the presets are data files with no build step.

## Open Questions

- Biome reports `noArrayForEach` as recommended, while `noForEach` is not. When
  `noArrayForEach` graduates, it would join the recommended set beside the listed
  `noForEach`. Whether either should then leave the lists is a later pass's decision,
  and that pass will see it as a graduation.
