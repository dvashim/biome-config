# Design: enforce-preset-scope

## Context

See `proposal.md` — Why. The tooling this builds on landed in
`mechanize-rule-audit`: `audit/rule-metadata.json` carries each rule's domains
and the languages of its published examples, and `scripts/check-presets.ts`
already runs seven invariants over it offline.

The constraint that shapes everything here: the existing **Coverage** invariant
runs in one direction. It walks every rule the release declares and asks whether
each is accounted for — and "listed in `react-strict`" is one of the accepted
answers. A rule that should not be there satisfies it by being there. No amount
of tightening Coverage finds this class of defect; it needs a second walk, over
the presets rather than over the release.

## Goals / Non-Goals

**Goals:**

- The two GraphQL rules leave the presets, and a check exists that would have
  caught them.
- The scope test is written so that a later implementer cannot narrow it into the
  false-positive shape described below.
- The ledger can record either verdict, so a rule that is correctly listed but
  unprovable has somewhere to live.

**Non-Goals:**

- **No Biome version movement.** The pinned target stays 2.5.9 and
  `audit/rule-metadata.json` is not regenerated — the rule metadata is unchanged,
  only which rules the presets list. The 2.5.10 pass stays separate; conflating
  them would put a rule-list change and a `$schema` advance in one diff.
- **No review of the `types` domain.** Deferred in the proposal.
- **No new relaxations.** The balanced table does not move.

## Decisions

### 1. The scope test is a disjunction, and exclusion is all-or-nothing

A listed rule is in scope when **either** it targets a language the presets cover
**or** it belongs to an in-scope domain. A rule is out of scope only when *every*
language it publishes is excluded, or *every* domain it declares is an excluded
framework domain.

*Why both halves matter, with live cases:*

- **Disjunction.** 33 listed rules belong to domains the requirement never names
  — `types` (17), `playwright` (11), `drizzle` (2), `tailwind` (2), `turborepo`
  (1). They are in scope through their language. A check that classified by domain
  alone would flag all 33.
- **All-or-nothing.** A rule that serves an excluded framework as well as an
  in-scope one must stay in scope. **No rule in 2.5.9 exercises this**, and the
  obvious examples do not: `useJsxKeyInIterable` (`[qwik, react]`) and
  `noDuplicatedSpreadProps` (`[react, solid]`) both publish `jsx` examples, so
  the language clause covers them and the domain reading cannot change their
  outcome. Of the 48 rules with no in-scope language, every one has either no
  domain or a single framework domain. The property is therefore defensive, and
  is verified against a synthetic mixed-domain rule rather than a live one.

Both readings are pinned as spec scenarios rather than left to the code, because
the code is the thing most likely to be rewritten.

### 2. The ledger gains a direction rather than a second file

`{ "<rule>": { "direction": "in" | "out", "reason": "…" } }`, replacing
`{ "<rule>": "<reason>" }`.

*Why not a second file:* the two lists would answer the same question — "what did
a human decide about a rule the metadata cannot place?" — and splitting them means
two places to look and two ways to forget one.

*Migration cost is nil:* the ledger is empty today, so this change writes the
shape and its first entry together.

*The first entry is `noRestrictedTypes`*, direction `in`. It is a TypeScript rule
whose only fenced block is its own options sample, so it publishes no example to
read a language from. Nothing about that is going to change on Biome's side, and
the alternative — special-casing the `noRestricted*` family in the check — would
bury a judgment call in code.

### 3. Removals land before the check

Within the change, the two rules come out first and the invariant goes in after.
A reviewer walking the commits never sees a state where `pnpm run check` fails,
and the check's first run is against presets that already satisfy it.

### 4. `noDuplicateEnumValueNames` is allowed to revert to `error`

Removing the entry does not disable the rule — it is recommended, so it stays
active at Biome's default `error` rather than the `warn` the presets were
publishing.

*The alternative is not available.* Listing is the only way to set a severity, so
keeping `warn` means keeping a GraphQL rule enumerated, which is the violation
this change exists to fix. There is no third option.

*And the softening was never a decision.* The rule has been `warn` in every
revision it has appeared in, which is the house severity every added rule
receives. Nothing in the history records an intent to downgrade it. Reverting to
the upstream default restores a state the presets never deliberately left.

The changeset says this plainly, because "we removed a rule" and "your GraphQL
diagnostics got louder" are not the same sentence, and only consumers who lint
`.graphql` files see either.

## Risks / Trade-offs

- **A consumer linting GraphQL sees `noDuplicateEnumValueNames` go `warn` →
  `error`**, which can turn a green build red → Mitigation: disclosed explicitly
  in the changeset rather than folded into the rule-removal line; the fix on their
  side is one override, and the presets never intended the softening.
- **The scope invariant is the kind of check that is tempting to narrow** — a
  future edit that classifies by domain alone would flag 33 correct rules, and the
  obvious "fix" would be to widen the excluded-domain list rather than restore the
  disjunction → Mitigation: both readings are spec scenarios, so narrowing the
  code fails the spec rather than merely looking wrong.
- **The ledger can be used to paper over a real violation** — anything flagged can
  be silenced with an `in` entry → Mitigation: entries carry a reason and are
  reviewed in the diff, and the invariant that flags a rule is the same one that
  makes the silencing visible. This is a social control, not a technical one, and
  worth naming as such.
- **`-stable` rule counts change**, so the README's 182 appears twice and is easy
  to half-update → Mitigation: the README-inventory invariant already added by the
  previous change fails on exactly that.

## Migration Plan

1. Remove both rules from `react-strict` and `react-balanced`; run
   `pnpm sync-stable`; confirm 264 → 262 and 182 → 180.
2. Update `README.md` — two counts, two totals, two prose mentions.
3. Reshape `audit/rule-exclusions.json` and add the `noRestrictedTypes` entry.
4. Add the scope invariant to `scripts/check-presets.ts`; confirm it reports zero
   against the corrected presets, and that it flags each of the three rules when
   they are put back one at a time.
5. Add the `minor` changeset.

Rollback is restoring the two rule entries and dropping the invariant; nothing
else depends on either.
