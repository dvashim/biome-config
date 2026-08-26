# Proposal: enforce-preset-scope

> Scope note: this change corrects a live violation of `Out-of-scope rules are
> excluded` and adds the check that would have caught it. It is the follow-up
> recorded in `mechanize-rule-audit`'s `Deferred` section, and unlike that change
> it does touch the published presets.

## Why

Both presets list two GraphQL-only rules — `useDeprecatedDate` and
`noDuplicateEnumValueNames` — against a requirement that says the presets SHALL
NOT enumerate GraphQL language rules, and against the README's own claim that
"rules exclusive to GraphQL or other frameworks … are intentionally omitted."

It survived nine version-tracking passes because nothing looked in that
direction. The coverage check added by `mechanize-rule-audit` accounts for
*unlisted* rules, so a listed rule is counted as accounted for whether or not it
belongs. Deriving each rule's language from its published examples is what
surfaced it, and the same derivation makes the missing check trivial to add.

## What Changes

- **Remove both rules** from `react-strict` and `react-balanced`, and regenerate
  the `-stable` variants: **264 → 262** listed rules in the parents, **182 → 180**
  in the `-stable` variants. Both rules are stable-category, so both removals
  reach all four presets.
- **Add the eighth invariant to `check:presets`** — every rule a preset *lists*
  is in scope, the opposite direction from the existing coverage check. Against
  the presets as they stand it flags exactly three rules: the two above, and
  `noRestrictedTypes`.
- **Give the exclusion ledger a direction.** `noRestrictedTypes` is the third
  flag and it is **not** a mistake: it is a TypeScript rule, correctly listed, but
  it publishes only an options sample and no code example, so no metadata places
  it either way. The ledger as specified can only record that a rule is *out of*
  scope, so it cannot express this. Each entry gains a direction (`in` / `out`)
  alongside its reason, and the ledger is seeded with `noRestrictedTypes` as `in`.
- **Update `README.md`** — the `correctness` count 25 → 24, the `suspicious`
  count 42 → 41, the strict total 264 → 262, both `-stable` totals 182 → 180, and
  the two prose mentions (line 234 names "duplicate enum member names", line 269
  names `useDeprecatedDate`). The relaxation table is untouched; neither rule is
  relaxed, so the 18 / 15 figures do not move.
- **Add a changeset (`minor`).** Preset rule lists change, which the standing
  requirement pins as the `minor` case.

### Both rules are GraphQL, and both were accidents

Every example either rule publishes is GraphQL — that is the whole basis of the
classification, and it is the same signal the coverage check already trusts.
`noDuplicateEnumValueNames` is about enum value names in a GraphQL schema, not TS
enums; `useDeprecatedDate` requires a deletion date on the `@deprecated`
directive.

Neither is a deliberate opt-in that the spec would protect:

- `useDeprecatedDate` entered in `850c249`, the bulk pass that added 41 opt-in
  rules for Biome 2.5.1. It is **not** recommended, so listing it was an explicit
  opt-in to an out-of-scope rule — a mis-classification in a bulk sweep.
- `noDuplicateEnumValueNames` predates the `.jsonc` → `.json` rename and has been
  `warn` in **every** revision it has ever appeared in. Its Biome default is
  `error`, so the entry *looks* like a deliberate downgrade, which
  `Deliberate overrides of recommended rules are preserved` would protect. It is
  not: `warn` is simply the house severity every added rule receives, applied by a
  bulk pass. Nothing in the history records a decision to soften this rule.

### Removing them is not symmetric — one keeps firing

Worth stating plainly, because the two removals have opposite consumer effects:

- `useDeprecatedDate` is **not** recommended, so removing the entry switches it
  **off**. Consumers linting `.graphql` files lose those diagnostics.
- `noDuplicateEnumValueNames` **is** recommended, so removing the entry does not
  disable it — it reverts to Biome's default and stays active at **`error`**
  instead of `warn`. The diagnostic gets *louder*, not quieter.

The second is a correction rather than a regression: the presets never decided to
soften that rule, and consumers who do not lint GraphQL see neither change.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: **three modified requirements**.
  - *Mechanically decidable preset invariants are enforced by the build*
    (MODIFIED) — its invariant list runs in one direction only, accounting for
    every rule the release declares. A rule that is listed satisfies coverage by
    being listed, so the list cannot detect a rule that does not belong. The
    requirement gains the opposite invariant and the scenario for it.
  - *Out-of-scope rules are excluded* (MODIFIED) — the ledger is specified as
    recording "the reason it is out of scope", which cannot express a rule that is
    *in* scope but whose metadata cannot prove it. `noRestrictedTypes` is that
    case today. Entries gain a direction so the ledger can record either verdict.
  - *In-scope non-recommended rules are explicitly enabled* (MODIFIED) — its scope
    test is a language clause **or** a domain clause, but the domain clause names
    only React, Next.js, React Native, `test`, and `project`, while the presets
    list rules in the `types` (17), `playwright` (11), `drizzle` (2), `tailwind`
    (2), and `turborepo` (1) domains. Those are in scope through the *language*
    clause, so nothing is wrong — but an implementer reading the domain clause as
    the classifier would flag 33 correct rules. A scenario pins the disjunction so
    the check cannot be built the narrow way.

## Impact

- **Published package** (triggers a `minor` release): all four react presets lose
  two rules, and `README.md` loses two rule mentions and four counts. Consumers of
  every react preset are affected; `recommended` and `react-recommended` are not
  touched. Only consumers who lint `.graphql` files see any diagnostic change.
- **Tooling**: `scripts/check-presets.ts` gains the scope invariant;
  `audit/rule-exclusions.json` gains a direction per entry and its first entry.
  `audit/rule-metadata.json` is **not** regenerated — the rule metadata does not
  change, only which rules the presets list.
- **Specs**: `linter-rule-coverage`, three requirements modified.
- **Not touched**: the pinned Biome target (still 2.5.9 — the 2.5.10 pass is
  separate), the relaxation table, `-stable` generation, and the metadata sweep.

## Deferred

- **Whether the 17 `types`-domain rules are deliberate.** They are in scope
  through the language clause, so the new invariant passes them, and this change
  only pins that reading. Whether the presets *should* carry a domain the standing
  requirement has never named is a separate question, and answering it means
  reviewing 17 rules rather than 2.
