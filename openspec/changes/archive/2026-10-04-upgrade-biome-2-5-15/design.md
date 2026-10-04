# Design

## Context

See `intent.md` — Slice, and `proposal.md` — What Changes. The current state that
shapes the approach, all observed on 2026-10-04:

- **The binary is already at the target; the declaration and the pins are not.**
  The installed Biome is 2.5.15 (PR #216 moved the lockfile), while `package.json`
  at `HEAD` still declares `^2.5.14` — the lockfile records specifier `^2.5.14`,
  version `2.5.15`. The presets, `biome.json`, the README, and
  `audit/rule-metadata.json` all say 2.5.14. `pnpm run check` passes (58 s):
  `check:rule-metadata` verifies the snapshot against a **fetched** 2.5.14
  (docs/adr/0001), and `check:presets` reports `546 rules classified, 280 listed, 0
  unaccounted`. Every failure this pass produces is therefore one it caused.
- **The working tree is not clean.** It already raises the `@biomejs/biome` range to
  `^2.5.15`, mixed with unrelated bumps (`@types/node ^26.6.4`, `publint ^0.3.25`,
  `packageManager` pnpm 12.9.1, regenerated OpenSpec 1.14.0 assets) and the
  uncommitted archive of `close-coverage-gaps`. Only the Biome range belongs here.
- **One release, one hop.** npm published 2.5.14 on 2026-09-16 and 2.5.15 on
  2026-09-30, with nothing between them, and `latest` is 2.5.15. The multi-release
  requirement's per-hop diff is the endpoint diff.
- **The evidence below comes from scratch copies, never the repository.** A sweep of
  2.5.15 ran in a copy of the repository with its pins moved to 2.5.15; the fixtures
  ran in a scratch directory against the installed 2.5.15 and a fetched 2.5.14.
- **Relaxations are counted by whole-entry comparison** between balanced and strict,
  and the README must report the stable-category subset separately.

## Goals / Non-Goals

**Goals:**

- Bring the pinned target, the snapshot, the declared range, and the binary level at
  2.5.15, so every check reads 2.5.15 from the installed binary.
- Settle each added rule's level on recorded evidence, and record what 2.5.15 does
  to rules the presets already list.
- Record the outcome of every audit the standing requirements name, including the
  ones whose answer is "nothing".

**Non-Goals:**

- **Options for the added rules.** All eight land as bare severity strings, as every
  addition before them has. `useLogicalProperties`' `direction` (default `"ltr"`)
  and `noTailwindRawColors`' `allowedColors` (default `[]`) stay unset; both
  defaults match the presets' intent.
- **README highlight entries for the additions.** The highlights are curated, and
  `check:presets` checks only that the rules they name exist.
- **A peer dependency on `@biomejs/biome`** — left to its own change, as in the
  2.5.14 pass.
- **Landing the unrelated working-tree changes**, or reconciling the `intent-first`
  schema fork with OpenSpec 1.14.0's built-in schema. Both are dev-tooling work under
  `dev-tooling-currency`, outside the shared intent.
- **Making `check:presets` read prose** such as the `useReactCompiler` highlight. The
  README-inventory requirement names what is enforced; this pass corrects the
  sentence by hand.

## Prior decisions

- **docs/adr/0001** (in force) — the snapshot is read, verified, and serialized by a
  binary of the release the presets pin. Before the pin moves, that is a fetched
  2.5.14; once it moves, it is the installed 2.5.15, so regeneration and every later
  `check:rule-metadata` run locally with no network. Between advancing the pins and
  regenerating, the check fails with drift — expected mid-pass. This design relies on
  the ADR and revisits nothing.

## Decisions

### 1. The rule audit is the schema diff, and the snapshot must reproduce it

Rule keys under the eight category definitions of the 2.5.14 and 2.5.15
configuration schemas, excluding the non-rule `preset` and `recommended` keys:
**11 added, 0 removed, 0 moved**, 546 → 557, with the category set unchanged. The
schema served at biomejs.dev for 2.5.15 equals the installed
`configuration_schema.json` as parsed JSON.

For the option audit, every rule present in both schemas was compared on its fully
resolved fragment with descriptions stripped. **One** rule changed:
`noTailwindArbitraryValue`, listed in both parents, whose options object loses
`attributes` and `functions` and is now empty and closed (decision 4). No other rule
changed, listed or not. Only two shared definitions differ at all —
`NoTailwindArbitraryValueOptions` and the `Nursery` group — so nothing moved in the
formatter, parser, `files`, `vcs`, `html`, `css`, `json`, or `javascript` settings.

A scratch sweep of 2.5.15 produced 557 rules. Against the committed snapshot, it
shows the eleven added entries and **two changed existing entries**, neither of which
changes a classification:

- `useAltText` — languages `jsx` → `astro`, `jsx`. Recommended, domain-free, stable:
  still active via the recommended set.
- `useReactCompiler` — languages `js`, `json`, `jsx` → `js`, `jsx`. The `package.json`
  example left with the React 19 check (decision 5). Still in scope through `js`/`jsx`
  and `react`.

No category, severity, recommended flag, or domain moved. The regeneration must
reproduce exactly this diff. The empty answers — nothing graduated, renamed, or
removed, and no transient rule because there is no intermediate release — are audit
outcomes, not skipped steps.

### 2. Eight of the eleven are in scope, placed by the metadata alone

| Rule | Example languages | Domains | Biome default | Scope |
|---|---|---|---|---|
| `noMeaninglessVoidOperator` | js, ts | `types` | info | in (language) |
| `noMisplacedListElements` | jsx; also reports in HTML | — | error | in (language) |
| `noReactObjectTypeAsDefaultProp` | js | `react` | error | in (language and domain) |
| `noSelfImport` | js | `project` | error | in (language and domain) |
| `noTailwindRawColors` | jsx | `tailwind` | info | in (language) |
| `useLogicalProperties` | css | — | warn | in (language) |
| `usePromiseRejectErrors` | js | — | warn | in (language) |
| `useStrictBooleanExpressions` | js, ts | `types` | info | in (language) |
| `noAstroConflictingSetDirectives` | astro | `astro` | error | out (framework-only domain) |
| `noSvelteExportLet` | svelte | `svelte` | info | out (framework-only domain) |
| `useSvelteKitRuneImports` | js, svelte | `svelte` | warn | out (framework-only domain; its js example does not bring it in, because every domain it declares is excluded) |

No exclusion-ledger entry: the metadata places all eleven, and the ledger rejects an
entry for a rule the metadata already classifies. `biome explain` calls
`noMisplacedListElements` "recommended"; it is nursery, which the recommended set
never activates, so its entry is opt-in, not redundant.

Requirements this pass exercises only partly, or not at all, recorded so the
absence is visible:

- **Analysis scope.** `noSelfImport` resolves import specifiers. Measured, it
  reported only specifiers that resolve to the importing file — with an extension,
  extensionless in TypeScript (`./qux`), a directory index (`.`), and a dynamic
  `import()` — and not a sibling file's import of that module. A resolution miss can
  only hide a report, never report correct code, so the requirement's relaxation
  ground does not arise. `noTailwindRawColors` resolves nothing: by its own
  documentation it does not read the Tailwind configuration, and it publishes
  `allowedColors` for exceptions. It is relaxed on the policy ground (decision 3),
  not this one.
- **Dependency-based suppression without a domain:** no addition does this.
- **Configuration-required rules:** none. Every addition reports with no options.
- **Gating:** the two additions in dependency-gated domains are measured in
  decision 3. `types` and `project` declare no gating dependency.

### 3. Levels, from fixtures run against the installed 2.5.15

The fixtures use a copy of `react-strict` with `vcs.enabled: false` and the eight
rules added under `nursery` at `warn`, as the presets will list them. The React and
Tailwind sources are repeated in a directory with **no `package.json`** and in one
declaring `react` and `tailwindcss`, for the gate test.

| Rule | Fires on | Silent on |
|---|---|---|
| `noMeaninglessVoidOperator` | `void log()` where `log` returns `void`; `() => void log()` | `void fetchData()` (a promise); `void value()` (a discarded number); `void 0` |
| `noMisplacedListElements` | JSX `<div><li>`; `<div>{items.map(… <li>)}</div>`; HTML `<div><li>` | `<ul>{items.map(… <li>)}</ul>`; an `<li>` returned from a component; `<List><li>` |
| `noReactObjectTypeAsDefaultProp` | `function Button({ items = [], onClick = () => {}, style = {} })` (three); `const Card = ({ config = {} }) => …` | module-constant and primitive defaults; lowercase `helper` and `makeConfig`; the hook `useThing` |
| `noSelfImport` | `./foo.js` in `foo.js`; `import("./baz.js")` in `baz.js`; `./qux` in `qux.ts`; `.` in `index.js` | `bar.js` importing `./foo.js` |
| `noTailwindRawColors` | `bg-pink-500`, `text-slate-950`, `hover:text-red-500/80`; palette-shaped names in a non-Tailwind class list (`text-gray-600`, `bg-blue-100`, `border-red-500`) | `bg-white`, `text-black`, `bg-primary`, `text-muted-foreground`; Bootstrap-style `alert-danger`, `text-white`, `bg-dark`, `text-muted` |
| `useLogicalProperties` | every physical property in one rule: `width`, `height`, `margin-left`, `padding-top`, `top`, `border-left` (6 of 6) | `inline-size`, `margin-inline-start` |
| `usePromiseRejectErrors` | `Promise.reject("…")`, `Promise.reject()`, `reject(42)`, `reject()`, `Promise.reject({ code: 1 })` | `new Error(…)`; a passed-through `err` in `rej(err)` and `Promise.reject(err)` |
| `useStrictBooleanExpressions` | `if (disabled)` (optional boolean), `if (label)` (optional string), `if (count)` (optional number), and the same three as JSX `&&` operands | a nullable object (`user`); a non-nullable number (`items.length`) |

`noReactObjectTypeAsDefaultProp` and `noTailwindRawColors` reported the same
diagnostics (4 and 6) **with no `package.json`** as with their dependencies declared:
explicit listing defeats both gates, so both reach every consumer of the two parents.

| Rule | strict | balanced | Ground |
|---|---|---|---|
| `noMeaninglessVoidOperator` | warn | warn | Fires only where code applies `void` to a call that already returns nothing, or to a non-call value. Biome's default is `info`; the convention puts additions at `warn`, as `noReturnInFinally` in the 2.5.14 pass. |
| `noMisplacedListElements` | warn | warn | Fires only on invalid list markup; component boundaries are exempt. |
| `noReactObjectTypeAsDefaultProp` | warn | warn | Fires only on non-primitive defaults in capitalized components — a new value on each render, the hazard it documents — and the fix is mechanical (hoist a module constant). It reaches every consumer, but its trigger is component code: helpers and hooks were silent. Balanced keeps React render-performance rules: `noJsxPropsBind` is `error` in both parents. |
| `noSelfImport` | warn | warn | Fires only on a module that imports itself. |
| `noTailwindRawColors` | warn | **off** | A design-system policy: it reports every palette color — Tailwind's default way to color — and allows only custom names. Balanced already turns `noTailwindArbitraryValue` off on the same ground: how a team constrains its Tailwind classes is the team's choice. Its reach beyond Tailwind, to palette-shaped names in any class list, adds to the case. |
| `useLogicalProperties` | warn | **off** | Reports every physical property, `width` and `height` included — effectively every stylesheet. Writing-mode support is a project decision. That is the `useLayeredStyles` shape (a sanctioned practice reported everywhere), so `off` rather than `info`. |
| `usePromiseRejectErrors` | warn | warn | Fires only on literal non-Error reasons and empty rejections; passed-through values are allowed. |
| `useStrictBooleanExpressions` | warn | **off** | Reports every truthiness check on an optional boolean or string — the idiomatic optional-prop test — beside the genuine nullable-number hazard, and has no options to narrow it. In JSX, `noLeakedRender` (`error` in both parents) already reported every `&&` operand in the fixture, the `count && …` zero render included, so balanced keeps that hazard covered. `off` rather than Biome's default `info`, which would still report across the whole codebase. |

Alternatives rejected: `useStrictBooleanExpressions` or `useLogicalProperties` at
`info` in balanced (both still report across a whole codebase);
`noTailwindRawColors` at `info` (contradicts `noTailwindArbitraryValue`'s `off` for
the same kind of policy); relaxing `noReactObjectTypeAsDefaultProp` (accurate,
mechanically fixable, and the balanced precedent keeps `noJsxPropsBind` at `error`).
Only `noMeaninglessVoidOperator` has a fix, and it is **unsafe**, applying only under
`--unsafe`.

### 4. `noTailwindArbitraryValue`: nothing to migrate, a detection change to disclose

2.5.15 removes `attributes` and `functions` (#11860); the rule now uses
`useTailwindShorthandClasses`' detection. Both parents list it as a bare string, so
no preset entry changes and there is no option to adopt or drop. That is the option
audit's recorded outcome.

Measured against eight class-string forms in a project declaring `tailwindcss`:
2.5.14 reported `className`, `cn()`, `twMerge()`, a template literal, `classNames()`,
and `class=`. 2.5.15 reports the same **except `classNames()`**, and adds the **`tw`
tagged template**. Neither reports `classList`. The change reaches `react-strict`
only: balanced lists the rule `off`, and it is nursery.

A team configuration that sets either removed option now stops with `Found an unknown
key`, where 2.5.14 accepted it. #11910 also makes Biome stop ignoring configuration
errors silently. Both go in the changeset.

### 5. `useReactCompiler` no longer gates itself

#11835, measured with one `Component.jsx` (a conditional `useState`) under a
`react-strict` copy:

| | no `package.json` | `react ^18.3.1` | `react ^19.1.0` |
|---|---|---|---|
| 2.5.14 | 0 | 0 | 1 |
| 2.5.15 | 1 | 1 | 1 |

2.5.14 skipped every project whose `package.json` did not declare React 19 or newer,
as its documentation said. 2.5.15's documentation drops that sentence and its
`package.json` example (the JSON language the snapshot loses). The rule now reaches
every `react-strict` consumer whose files define components or hooks. Under its
default `compilationMode: "infer"`, files that define neither are skipped (documented;
the tasks verify it).

The levels stay. In strict, `warn`: its reports are React Compiler's Rules-of-React
findings — the fixture's is a conditional hook — which hold whether or not a team
adopts the compiler, and React Compiler also targets React 17 and 18. In balanced,
`off`: its published reason, that most projects have not adopted the compiler, still
holds. Two statements become false and are corrected:

- **README**, React highlight: "and unlike the other framework rules here it stays
  silent unless `react` is an actual dependency". Reworded to say it runs like the
  other framework rules, whether or not `react` is a dependency. The new prose
  carries **no version number**, because the pinned-target invariant reads Biome
  version references in the README and would flag it on the next pass.
- **`CLAUDE.md`**: "`useReactCompiler` is the known exception that still self-gates."
  Reworded to record that it gated itself on React 19 until 2.5.15, so a rule's
  gating can change between releases, which is why it is measured each time.

No standing requirement names the rule, so no spec changes. Alternative rejected:
re-leveling strict because React 18 projects now receive it. Strict is the
opt-in-maximal preset, and the findings apply to them as well.

### 6. A domain set to `"none"` no longer turns off listed rules

#11919, measured with `noImgElement` (`next` domain, listed under `performance` in
the parents and both `-stable` variants):

| | preset alone | plus `"domains": { "next": "none" }` |
|---|---|---|
| 2.5.14 | reported | silenced |
| 2.5.15 | reported | reported |

A team that used a domain set to `"none"` to switch off rules the presets list gets
them back. The README's FAQ already shows the override that still works — turning
the rule off by category — so the README does not change, and the changeset points
there. The release note's own example adds that, with a domain enabled, setting a
second domain to `"none"` no longer disables rules shared with the first, which is
the shape `react-recommended` sets up (`"react": "recommended"`).

### 7. Resulting counts

| | today | after |
|---|---|---|
| `react-strict` / `react-balanced` listed | 280 | **288** |
| … of which nursery | 100 | **108** |
| `-stable` variants listed | 180 | 180 |
| balanced relaxations | 25 | **28** |
| … in stable categories (reach `react-balanced-stable`) | 15 | 15 |
| … in nursery | 10 | **13** |
| rules in the snapshot | 546 | **557** |
| listed rules belonging only to unnamed domains | 33 | **36** |
| listed rules the scope test's domain half alone would flag | 217 of 280 | **223 of 288** |

### 8. README edits, inside the matchers' constraints

- The seven version references (decision 10, step 1), with "Biome 2.5.0"-style
  historical mentions left alone.
- `up to 280 explicitly configured rules` → 288; `- **nursery** (100 rules)` → 108;
  the React strict sentence's `**280 rules**` → 288.
- The Configurations table: `React strict` → `288` / `108`; `React balanced` →
  `288, 28 relaxed` / `108`. The `-stable` rows stay `180` and `180, 15 relaxed`.
- `**25 targeted relaxations**` → 28; `Fifteen of the 25 relaxations` → 28, with
  "Fifteen" and "those 15" unchanged.
- Three relaxation rows under `nursery`, in alphabetical position:
  `noTailwindRawColors` after `noTailwindArbitraryValue`, `useLogicalProperties`
  after `useLayeredStyles`, and `useStrictBooleanExpressions` after
  `useReactNamingConvention`. Each is `warn` → `off`, with the ground from decision 3
  in one line.
- The nursery note names thirteen relaxations in alphabetical order, and the
  `-stable` sentence's "the ten nursery relaxations" becomes "thirteen".
- The `useReactCompiler` highlight (decision 5).

Two constraints come from `check:presets`. A number must not follow an em dash
directly, because `— (\d+) rules` is the `-stable` matcher. And
`up to N explicitly configured rules` must stay unique to the ladder bullet. None of
these edits changes the wording around a matched count.

### 9. Counts in `CLAUDE.md` and the checker comment are reworded, not renumbered

`CLAUDE.md` says the domain half alone would flag most of `react-strict`, "including
the 33 that belong only to domains the standing requirement never names", and
`scripts/check-presets.ts` repeats "the 33 listed rules" in the comment above
`IN_SCOPE_LANGUAGES`. This pass makes it 36 (`noMeaninglessVoidOperator`,
`useStrictBooleanExpressions` in `types`; `noTailwindRawColors` in `tailwind`). Both
are reworded to carry no count — "every listed rule that belongs only to …" — the
same remedy the 2.5.14 pass applied to the 201 figure. The checker edit is
comment-only and is verified as such. Renumbering to 36 was rejected: almost every
pass adds such a rule, and this one adds three.

The other `CLAUDE.md` statements this pass could move still hold, verified against
the scratch sweep: GraphQL-only rules still number 16, `noRestrictedTypes` is still
the only rule with no example language and the ledger's only entry, and "11 of the
119 in 2.5.14" is dated and stays true (2.5.15: 12 of 130).

### 10. Order of operations

1. `$schema` in the six presets and `biome.json`, the README version references, and
   the `@biomejs/biome` range with its lockfile specifier. The target, the
   declaration, and the binary now agree.
2. `pnpm sync-rule-metadata`, which now sweeps the installed binary. Between steps 1
   and 2, `check:rule-metadata` reports drift and the pinned-target invariant fails;
   both are expected mid-pass.
3. After the regeneration, coverage fails naming the eight in-scope rules. That
   failure is the audit confirming itself, and it clears as they are added.
4. Add the eight rules, run `biome check --write` so the `useSortedKeys` assist
   orders them (`pnpm run check` does not catch misordering), then `pnpm sync-stable`.
5. README counts and the relaxation table, `CLAUDE.md`, and the checker comment.
6. The behaviour corrections (decision 5), the migration preview, the changeset, and
   the full check.

### 11. Inherited behaviour, grouped by the consumers it reaches

The schema cannot see these. They come from the 2.5.15 release notes, each placed by
the snapshot's recommended and category data and the preset listings. All six presets
ship `html.experimentalFullSupportEnabled: true`, `vcs.useIgnoreFile: true`, and
`formatter.formatWithErrors: false`, which put the HTML-family, ignore-file, and
parse-error items in front of every consumer.

**All six presets:**

- *Configuration:* errors in a configuration file are no longer silently ignored
  (#11910). A team whose own configuration carried errors that 2.5.14 ignored now
  meets them. All six presets load cleanly under 2.5.15 (measured). A domain set to
  `"none"` no longer disables rules listed explicitly or shared with an enabled domain
  (#11919, decision 6).
- *Formatter:* Astro expressions are indented at the surrounding markup's column, and
  `biome format` now formats them (#11975). Comments around Svelte blocks are no
  longer duplicated (#11930), and a comment at the end of a block's contents is
  indented with them (#11931). No invalid parentheses around Svelte `{@const}`
  (#11837). The HTML formatter keeps the space between text and an inline element it
  joins onto the line (#12044).
- *Parser:* HTML reports a mismatched closing tag (`<p>two</span></p>`) and a stray
  top-level closing tag as errors, where the formatter used to delete what followed;
  tag names now match case-insensitively (#12022). With `formatWithErrors: false`,
  such files are reported rather than formatted. Astro frontmatter containing a regex
  that starts with `>` parses (#11907). `<<` followed by a later `>>>` and
  `f<T> << f<T>` parse as TypeScript does (#11908). Typed Vue slot props parse
  (#12030).
- *Recommended rules:* `noUnusedVariables` newly reports self-referencing
  expression-bodied arrows (#11959), and counts types used in Vue slot-prop
  annotations (#12030). `noUnreachable` and `useGetterReturn` treat
  `while (true)`-style loops as infinite (#11955). Fewer diagnostics from
  `noUnknownTypeSelector` (#11962) and `noUnknownProperty` (#11929). Corrected fixes
  from `noOctalEscape` (#11882) and `useRegexLiterals` (#11983).
- *Files and suppressions:* `vcs.useIgnoreFile` now applies parent-directory patterns
  to child paths (#11869), so re-included directories and their excluded siblings
  resolve differently. Suppression comments now work across HTML-ish files and
  embedded snippets (#11915).
- The Astro, Svelte, and Vue items reach consumers with those files although the
  frameworks' rules are excluded. The standing requirement asks for exactly that
  disclosure.

**`react-strict`, `react-balanced`, and both `-stable` variants** (listed
stable-category rules): fewer diagnostics from `useSimplifiedLogicExpression`
(#11761), `useNamingConvention` — which also stops its safe fix renaming a `namespace`
inside `declare global` (#11827) — `noUndeclaredVariables` (Vue slot props, #11875),
`noFocusedTests` (#11958, #12031), `useForOf` (#11900), and `noUnnecessaryConditions`
on `RegExp.exec()` results (#11877). `noUnnecessaryConditions` also newly reports
through nested generic aliases (#11814). Corrected fixes from
`noUselessStringConcat` (#11914) and `noUselessReturn` (#12037). Type inference is
more accurate (#12021, #11834) for the listed type-aware stable rules.

**`react-strict` and `react-balanced` only** (listed nursery rules):
`useReactCompiler` now runs whatever React version is declared, or none (#11835,
decision 5 — strict only, since balanced lists it `off`). `noTailwindArbitraryValue`'s
options and detection change (#11860, decision 4 — strict only). Tailwind classes are
detected in Svelte, Vue, and Astro class expressions without a merging function
(#11802), reaching `useTailwindShorthandClasses` and, in strict,
`noTailwindArbitraryValue`. New diagnostics from `useExhaustiveSwitchCases` for
`Array.from` mapping values (#11878), and possibly from `noRestrictedDependencies`,
whose e18e replacement data was refreshed (#11997). Fewer from `useValidTestTitle`,
because test rules no longer mistake ordinary method calls named `test`, `it`, or
`describe` for tests (#12031). `noFloatingPromises`
and `noMisusedPromises` no longer overflow the stack on mutually-referencing generics
(#12041), and the type-aware nursery rules gain the same inference accuracy.

**No consumer of this package:** `noAstroSetHtmlDirective` (#11723) and the three
excluded additions (Astro and Svelte rules are out of scope); the GritQL formatter
(#11952) and plugin load messages (#11921), since no preset configures plugins.
Tooling-only changes — HTML formatter, indexing, and type-inference performance
(#12023, #12016, #12021), language-server watch patterns (#11868), module resolution
in long-running workspaces (#11965), daemon socket permissions (#11928), and a crash on
a closed pipe (#11978) — are not preset behaviour and are not disclosed as such.

### 12. Configuration migrations are previewed, not assumed

`biome migrate` without `--write` runs against a copy of each preset as a
`biome.json` and against the root `biome.json`. Each proposed rewrite is recorded as
adopted or declined, and adopted ones are applied by hand. Before the pins move,
2.5.15 already points at migrate for the `$schema` mismatch, an info-level notice on
a configuration's own `$schema` that a consumer extending a preset does not see
(measured). Advancing the pins adopts that rewrite. Migrate's output after step 1 is
the evidence for anything else.

### 13. The dependency range is this change's; the other bumps are not

The standing requirement advances "the declared dependency range" with the target,
so this change owns `package.json`'s `@biomejs/biome` (`^2.5.14` → `^2.5.15`) and the
lockfile importer's matching specifier. The resolved version is already 2.5.15. The
other working-tree bumps belong to `dev-tooling-currency`, which needs no changeset,
and land in their own commit. This change's diff to the two files is verified to be
those two lines. `pnpm install --frozen-lockfile` must accept the result, because CI
installs with `pnpm ci`.

### 14. The changeset

`minor`: both parents' rule lists change. It leads with the requirement to run
**Biome 2.5.15 or later** — `react-strict` and `react-balanced` name eight rules
2.5.14 rejects. Next come the inherited changes that reach all six presets, because
`recommended`, `react-recommended`, and `-stable` consumers see no rule-list movement
to explain them. That group includes both changes that stop a team's own settings
working: domain `"none"` (decision 6) and the removed Tailwind options (decision 4).
Then the four-preset and parent-only behaviour changes; the eight added rules with
their levels; the three balanced relaxations with their grounds; the three rules left
out and why; the counts from decision 7; and the corrected `useReactCompiler` README
claim. All eleven new rules are named, the shared intent's success signal read
literally.

## Constraints check

- **The shared intent records no constraints.** It lists those considered and ruled
  out with the originator: keeping teams' own additions and overrides working,
  updates starting to fail teams' checks, security or compliance review of new
  versions, lint run time, deadlines, and dependencies on other teams. The design
  treats none of them as a constraint. The two override breakages (decisions 4 and 6)
  and the version requirement (decision 14) are disclosed rather than prevented, and
  the new diagnostics may fail a warnings-as-errors CI.
- **The standing `linter-rule-coverage` requirements apply unchanged.** No delta spec
  (`skip_specs: true`). Each decision rests on an existing requirement: tracking
  `latest` with the declared range and a snapshot regeneration (decisions 1, 10, 13);
  in-scope rules enabled and out-of-scope rules derived from metadata (decision 2);
  the severity convention, gating observation, and analysis scope (decisions 2, 3);
  new options only against an upstream default (decision 4); the behaviour audit
  (decisions 4, 5, 6, 11); README inventory (decisions 7, 8); release sizing
  (decision 14). Requirements with nothing to act on are recorded under decision 2.
- **The `-stable` variants.** The shared intent names no constraint for them. Every
  addition is nursery, so `pnpm sync-stable` leaves both at 180 rules with only
  `$schema` changed. Their consumers still receive 2.5.15's stable-rule, formatter,
  parser, and configuration behaviour, which the changeset discloses.

## Risks / Trade-offs

- [A team upgrades the package but not Biome, and `react-strict` or `react-balanced`
  stops with "Found an unknown key"] → Stated first in the changeset and in the
  README's requirements table, and re-confirmed against 2.5.14 in the tasks.
- [`useLogicalProperties` and `useStrictBooleanExpressions` make `react-strict` loud
  — one diagnostic per physical CSS property, and per optional-prop check] → That is
  strict's opt-in-maximal contract. Balanced turns both off, the `-stable` variants
  never see them, and the relaxation table shows the choice before adoption.
- [`useReactCompiler` now reaches strict consumers on React 18 or without React
  declared, who also pay React Compiler's run time, which the 2.5.8 pass measured at
  +16% on a 60-file React fixture] → Disclosed in the changeset. Balanced is
  unaffected, and files with no components or hooks are skipped.
- [Teams that silenced listed rules with a domain set to `"none"`, or set the removed
  Tailwind options, find their configuration no longer does what it did] → Biome's
  own change; the changeset names both and the override that still works.
- [This change's dependency edit sits in a working tree mixed with unrelated bumps,
  so a careless commit ships them together] → Decision 13's verification limits this
  change's dependency diff to two lines; the other bumps land on their own.
- [The balanced levels rest on fixtures, not a real-world corpus] → The fixtures
  cover each rule's documented forms and the idioms that decide noise (optional
  props, physical CSS properties, palette classes, component defaults). The tasks
  re-run them before the changeset repeats their claims.

## Migration Plan

Teams upgrade the package together with Biome ≥ 2.5.15. Those who do not want the new
rules pin the previous minor or extend a `-stable` preset, whose rule content does not
change. Rollback is a package revert — the presets are data files with no build step.
