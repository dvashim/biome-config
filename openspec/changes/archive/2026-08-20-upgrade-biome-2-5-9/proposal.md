# Proposal: upgrade-biome-2-5-9

> Scope note: this is the recurring version-tracking pass. npm `latest` for
> `@biomejs/biome` is **2.5.9** and the installed range is **already `^2.5.9`** — an
> uncommitted `pnpm up` on the `up` branch moved it, along with `@changesets/cli`
> 3.0.0 → 3.0.1, `publint` 0.3.23 → 0.3.24, and pnpm 11.21.0 → 11.22.0 — while the
> presets still pin and document **2.5.8**. As in previous passes, the audit ran
> three ways: new linter rules, new configuration options, and upstream behavior
> changes the schema cannot see. The 2.5.8 → 2.5.9 schema diff adds exactly
> **five** rules, removes none, renames none, graduates none out of nursery, and
> adds no option to any already-listed rule, so the audit result is recorded below
> rather than assumed.

## Why

The presets carry a standing obligation to target the latest stable Biome release
and to explicitly enable every in-scope non-recommended rule
(`linter-rule-coverage`). Biome shipped **2.5.9**, and the dependency range moved
with a dev-dependency sweep, but nothing updated the consumer-facing surface: the
`$schema` URL in all seven config files and every README version reference still
say 2.5.8, and the rules 2.5.9 added are missing from the explicit opt-in lists.

This is the split state the standing requirement is keyed around — installed binary
ahead of the pinned `$schema` target — so the presets count as lagging and the
target advances.

## What Changes

- **Advance the pinned target 2.5.8 → 2.5.9** — the `$schema` URL in all six
  `dist/*.json` presets plus the root `biome.json` (seven files), and the five
  README version references (requirements table, `$schema` prose, example config,
  "built and tested against" line, `pnpm add -D` snippet). The `@biomejs/biome`
  range is **already `^2.5.9`**; this change adopts it rather than re-doing it.
- **Add four rules to `react-strict` and `react-balanced`; exclude the fifth:**
  - `useControlLabel` (`warn` / `warn`) — reports interactive controls (`button`,
    `menuitem`) with no accessible label. JSX **and** HTML, no domain, upstream
    default `error`. A control announced as an anonymous "button" is a real
    accessibility defect, and the rule's search is deliberately permissive:
    anything whose rendered output cannot be determined statically (an expression,
    a spread, a custom component) is assumed to provide a label. Measured at zero
    false positives, so no balanced relaxation.
  - `useNamedLayer` (`warn` / `warn`) — disallows anonymous CSS cascade layers
    (`@layer { … }`, `@import … layer`). An anonymous layer takes a slot in the
    cascade that no later rule can append to or reorder. CSS, no domain, upstream
    default `warn`. Narrow surface, so no balanced relaxation.
  - `useTailwindShorthandClasses` (`warn` / `warn`) — suggests a single shorter
    utility for functionally equivalent pairs (`w-4 h-4` → `size-4`). `tailwind`
    domain, upstream default `info`, unsafe fix. See the gating result below.
  - `noUnsafeTypeAssertion` (`warn` / **`off`**) — disallows every TypeScript type
    assertion except `as const`. TS, no domain, upstream default `error`.
    `react-balanced` turns it off; see below.
  - `useAstroClientOnlyDirectiveValue` — **out of scope, deliberately excluded.**
    Its only domain is `astro`, which the standing requirement already names among
    the excluded framework-only domains. 2.5.9 is the release that *introduces*
    the `astro` domain to Biome (`RuleDomain` gains one variant, the only
    non-rule schema change in the release), so the exclusion clause the spec
    already carried now has its first member.
- **Why `noUnsafeTypeAssertion` is `off` in balanced — measured, not assumed.**
  Enabled at `warn` alongside the other three and run over **443 files** of real
  React/TypeScript library code (`matkon`, `charts`, `ui`), it produced **72
  diagnostics** — 49 in a 280-file tree, 20 in a 103-file tree, 3 in a 60-file
  tree — while the other three new rules produced **zero between them**. Sampling
  the distinct flagged lines shows what the rule actually catches in library-grade
  React: d3 domain tuples (`s.domain() as [Date, Date]`), `Object.entries(names)
  as [keyof T & string, …][]`, slot/polymorphic forwarding (`children.props as
  AnyProps`), generic reducers (`(action as (prev: T) => T)(state)`), deliberate
  ref/context initializers (`null as unknown as X`, `undefined as never`), and
  `(await res.json()) as RawKline[]`. Substantially none are reachable by the
  alternatives the rule's own documentation recommends — `satisfies`, type
  predicates, assertion functions — because the assertion is bridging a gap in a
  *third-party or generic* type, not restating a local inference. This is the
  balanced preset's "too noisy, the pattern is legitimate" case, the same one that
  puts `noImplicitCoercions` at `off`. Lowering to `info` was rejected: at ~1
  diagnostic per 6 files it would establish a permanent noise floor rather than
  reduce one. This is the **third** nursery relaxation, after
  `noTailwindArbitraryValue` and `useReactCompiler`.
- **`useTailwindShorthandClasses` defeats its dependency gate — measured, not
  assumed.** Two fixtures identical but for `tailwindcss` in `package.json`, both
  linted with the presets' shape (explicit listing, no `domains` key): **3
  diagnostics with the dependency, 3 without**. Explicit listing therefore defeats
  the gate, as it does for every domain rule tested so far except
  `useReactCompiler`, and the rule reaches every consumer. **No balanced
  relaxation follows from that**, because the reach is self-limiting: the rule
  triggers only on strings that already read as Tailwind utility pairs, so a
  consumer without Tailwind has nothing for it to match — confirmed by the zero
  diagnostics across the 443-file measurement, none of which use Tailwind. It is
  otherwise the structural twin of `useSortedClasses` (upstream `info`, unsafe
  fix, `tailwind` domain), which the presets already list at `warn` in both.
  `noTailwindArbitraryValue` sits at `off` for a reason that does not transfer —
  arbitrary values are a *sanctioned escape hatch*, whereas `w-4 h-4` is simply a
  longer spelling of `size-4`.
- **Rule audit against 2.5.9 — five additions, nothing else.** A per-category
  rule-key diff of the 2.5.8 and 2.5.9 JSON schemas (**517 → 522** rules) shows
  the five additions above, all under `nursery`, and **no** rule renamed,
  graduated out of nursery, or removed. A full diff of the two schemas' definition
  sets changed exactly three things: the `Nursery` rule map, the `RuleDomain` enum
  (the new `astro` variant), and the five new rules' own
  `Configuration`/`Options`/`RuleWith…` definitions. Nothing in the assist
  `Source` actions, formatter, VCS, `files`, `javascript`, `json`, or `html`
  blocks changed. (Counts exclude each category's non-rule `preset` key, which
  runs the raw key count 8 high; the presets themselves declare no `preset` keys,
  so the per-category one-liner in `CLAUDE.md` is exact for `dist/*.json`.)
- **Coverage audit — no in-scope rule is missing.** Every 2.5.9 rule absent from
  `react-strict` (**262** of 522) was classified by running `biome explain` over
  the full rule set: **198** are recommended stable rules with no domain and so
  are already active through `recommended: true`; **46** belong to framework-only
  domains (vue 33, qwik 6, svelte 3, solid 2, solid+qwik 1, astro 1); **14** are
  GraphQL-only. All three groups are omitted by an existing requirement, leaving
  the four rules above as the complete set of in-scope gaps and **zero**
  pre-existing ones.
- **Configuration-option audit — no new option on any listed rule, and none on the
  new ones.** All four in-scope additions declare
  `{"type":"object","additionalProperties":false}` — literally empty options — so
  each is listed as a bare severity string, which is also what the standing
  convention requires when the upstream default already matches the presets'
  intent. No shared configuration definition changed.
- **Behavior-change audit — inherited, not masked.** A schema diff cannot see a
  change to what an existing rule reports or what the formatter emits, so the
  2.5.9 release notes were read separately. The largest consumer-visible impact of
  this bump is **not** the rule list:
  - **Six HTML formatter changes.** Blank lines between comment groups and after
    elements with trailing spaces are now preserved; whitespace handling is fixed
    for `marquee`, `noscript`, `video`, `audio`, and `object`; text wrapping now
    accounts for the width of an adjacent closing tag; a wrap no longer inserts
    rendered whitespace between an element and touching text; and a parent wraps
    when it starts or ends with a block-like child such as `source`, `track`, or
    `param`. All six presets configure `html`, so **every** consumer that formats
    HTML gets different output from this bump, including `recommended` and the
    `-stable` variants whose rule lists do not move.
  - **Four Tailwind parser expansions** — container-query variants (`@sm:`,
    `@max-lg:`, `@min-[400px]:`), child and descendant variants (`*:`, `**:`), the
    legacy leading `!` important marker, combinator selectors and modifiers in
    arbitrary variants, and modifiers on bare utilities (`@container/sidebar`,
    `shadow/50`). Classes the 2.5.8 parser could not read now parse, so
    `useSortedClasses` (listed, `warn` in both) can order them differently and
    `noTailwindArbitraryValue` can see more.
  - **CSS parser recovery** at declaration boundaries after a bogus declaration,
    plus acceptance of `@variant @xl` container-query names that previously raised
    a parse error and a spurious `noUnknownAtRules` diagnostic — a recommended
    rule, hence active in all six presets.

  Five further changes make rules the presets activate report **less**, and need
  no action: `noComponentHookFactories` (listed, `warn`) only reports a
  `use`-prefixed variable when a function is assigned directly; `useExpect`
  (listed, `warn`) recognizes Vitest Browser Mode `expect.element()`;
  `useJsxKeyInIterable` (listed, `warn`) no longer flags Astro files;
  `noSvgWithoutTitle` and `useGenericFontNames` (both recommended, hence active)
  stop flagging `aria-hidden` shorthand and the `math` generic font family
  respectively. `noMisusedPromises` and `noFloatingPromises` (both listed) had a
  performance regression restored, `noExtraBooleanCast`'s safe fix now preserves
  parentheses, TypeScript `compilerOptions.paths` resolution was corrected for
  targets omitting `./`, and a Windows ARM64 crash was fixed.
- **Regenerate the `-stable` variants.** All four additions are nursery, so
  `pnpm sync-stable` strips them; the `-stable` rule lists stay at **182** rules
  and change only in their `$schema` line. The balanced relaxation likewise does
  not reach `react-balanced-stable`.
- **Update documentation** — refresh every `2.5.8` reference in `README.md`, raise
  the `react-strict` / `react-balanced` totals 260 → 264 and the nursery count
  78 → 82, add all four rules to the nursery highlights, add a
  `noUnsafeTypeAssertion` row to the balanced relaxation table (17 → 18
  relaxations), and update the two places that reconcile the relaxation counts —
  15 of the 18 now live in stable categories, and `react-balanced-stable` keeps
  exactly those 15. The `182` figures stay as they are. Separately, correct
  `CLAUDE.md`, which still describes the presets as "254 explicit rule entries …
  (72 of them nursery)" against an actual 260 / 78 heading to 264 / 82.
- **Add a changeset (`minor`).** Preset rule lists change, which the standing
  requirement pins as the `minor` case. The changeset names the four added rules
  **and** the HTML formatter movement, since the latter reaches consumers whose
  rule lists do not change.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one modified requirement** and **one added
  requirement**.
  - *A listed domain rule's gating behavior is established empirically* (MODIFIED)
    — the requirement pairs "gate defeated" with assessing noise for consumers
    outside the framework, and the only relaxation scenarios it carries end in a
    balanced relaxation. `useTailwindShorthandClasses` is the first rule to defeat
    its gate and still warrant **no** relaxation, because its trigger pattern is
    itself framework-specific: it reaches every consumer but matches nothing in a
    project that does not use the framework. A scenario is added for that outcome
    so the finding is a recognized result rather than an unrecorded exception.
  - *Upstream behavior changes are audited from the release notes* (ADDED) — every
    pass so far has had to read the release notes for changes a schema diff cannot
    detect, and in this release that audit found the bump's **largest** consumer
    impact: six HTML formatter changes that alter output for all six presets,
    including the ones whose rule lists do not move. No requirement mandates that
    audit or its disclosure, so a `minor` release could truthfully describe itself
    as a rule-list change while silently reformatting consumers' HTML.

## Impact

- **Published package** (triggers a minor release):
  `dist/biome.react-strict.json` and `dist/biome.react-balanced.json` (four new
  nursery rules + `$schema`), the other four `dist/*.json` presets (`$schema`
  only), `README.md`, and `package.json` (already-bumped `@biomejs/biome` range).
  `react-strict` consumers gain four `warn`-level rules, of which
  `noUnsafeTypeAssertion` is the one that will actually be felt — expect roughly
  one diagnostic per six files in TypeScript library code. `react-balanced`
  consumers gain three. `-stable`, `recommended`, and `react-recommended`
  consumers see no rule change — but **every** preset inherits 2.5.9's HTML
  formatter changes, its Tailwind and CSS parser expansions, and the
  false-positive fixes listed above. Those follow from upgrading Biome, not from
  this rule-list change.
- **Root config**: `biome.json` `$schema` (the repo dogfoods the `recommended`
  preset, which carries no nursery rules, so its own checks are unaffected).
- **Repo docs**: `CLAUDE.md` rule-count prose, stale since before 2.5.8.
- **Specs**: `linter-rule-coverage` — one requirement modified, one added.
  `dev-tooling-currency` is exercised but unchanged: the `pnpm up` also moved
  `@changesets/cli`, `publint`, and pnpm to their npm `latest`, all patch or minor
  and none crossing a major boundary, and the OpenSpec CLI is at 1.9.0 matching
  every skill's `generatedBy`, so no regeneration is owed.
- **Not touched**: formatter / VCS / files / overrides settings, the seven
  non-nursery rule categories, Node `engines` and `.node-version`, the CI
  workflows, and the package `version` (Changesets owns the release bump).
