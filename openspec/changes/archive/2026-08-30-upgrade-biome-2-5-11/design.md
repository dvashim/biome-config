# Design: upgrade-biome-2-5-11

## Context

See `proposal.md` — Why, and its fixture table for the new rule's measured
behaviour. Two things about *this* pass differ from recent ones:

**The installed binary is not ahead.** Every pass since 2.5.7 found the
devDependency already moved by an automated sweep and adopted it. Here both the
target and the binary sit at 2.5.10, so the dependency has to be bumped and
installed *before* `sync-rule-metadata` can run — the sweep refuses when the
pinned target and the installed binary disagree, and after the `$schema` edit
they will.

```
  bump devDependency to ^2.5.11  -->  pnpm install
            |
            v
  edit $schema in 7 files (target now 2.5.11, binary 2.5.11 — they agree)
            |
            v
  pnpm sync-rule-metadata          <-- refuses if run before the two agree
            |
            v
  add the rule, pnpm sync-stable, then the README
```

**`check:presets` now blocks on published totals.** `enforce-readme-totals`
landed the invariant that makes this pass unable to complete while any published
count is stale. That is the intended behaviour and it means more edit sites than
previous passes had — the ladder bullet and four table cells that earlier passes
never touched.

## Goals / Non-Goals

**Goals:**

- Advance the target and reconcile the rule set against 2.5.11.
- Level the new rule on measured behaviour rather than on its category.
- Record the upstream behaviour changes that reach presets whose rule lists do
  not move.

**Non-Goals:**

- Revisiting whether nursery rules belong in the presets. The opt-in stance is
  settled; this rule is leveled within it.
- Adding a ledger entry for `noAstroSetHtmlDirective`. Its only domain is
  `astro`, which the metadata already places out of scope, and the checks reject
  a ledger entry the metadata classifies in the same direction.
- Fixing `CLAUDE.md`'s unchecked relaxation count as a general problem. This pass
  updates the number because it moves; closing the class is separate work.

## Decisions

### 1. `info` in balanced

The diagnostic is unactionable in the architecture that triggers it: a consumer
with tokens in `globals.css` cannot satisfy the rule by editing the file the
diagnostic points at, cannot declare the property through an option the rule does
not have, and cannot silence it with the `var()` fallback the language provides.
That is the case for relaxing it below strict's `warn`.

It is not a case for `off`, for two reasons that only surfaced once the rule was
in the tree. Biome ships it at `defaultSeverity: info` — upstream's own reading is
that it is below warning confidence — so `info` adopts that default rather than
overriding it in either direction, and balanced is left one step from strict
rather than two. And the rule *is* accurate for a self-contained stylesheet: a
CSS module that declares what it uses stays quiet, which the fixture confirms, so
`off` would cost those projects a real typo check to silence a noise source they
do not have.

*Alternative — `off`:* this was the initial call, on the ground that a rule which
fires on correct code should not fire at all. Reversed: "fires on correct code"
is true of the cross-file architecture, not of every consumer, and `off` decides
for the ones it does not describe. `info` is visible without asserting the
consumer must act.

*Alternative — leaving it at `warn` in balanced:* rejected. It would make the two
presets identical for this rule, which is the one thing balanced exists not to be
where a rule is broadly firing.

### 2. `warn` in strict, following the convention

Strict keeps `warn` despite the same behaviour, because the rule is genuinely
useful inside a self-contained stylesheet — a misspelled `var(--colour)` next to
its `--color` declaration is exactly what it catches — and a consumer choosing
`react-strict` has opted into review burden. The house convention says added
rules land at `warn` in strict, and nothing here argues the rule is *wrong*, only
that its scope is narrower than most projects' architecture.

*Alternative — `info` in strict too:* rejected. It would deviate from the
convention on a rule that behaves exactly as documented, and it would leave the
two presets differing by two steps rather than one.

### 3. Record the recommended-rule fixes as the pass's main consumer impact

```
  rule                 recommended  listed in strict     reaches
  ------------------------------------------------------------------
  noUnusedVariables       yes       no (redundant)    ALL SIX presets
  noGlobalAssign          yes       no (redundant)    ALL SIX presets
  useValidAnchor          yes       no (redundant)    ALL SIX presets
  noFloatingPromises      no        yes (nursery)     strict + balanced
```

2.5.11 carries three separate `noUnusedVariables` fixes (Vue `v-bind()` in CSS,
TypeScript generic parameters on function overloads, Vue custom directives), plus
`noGlobalAssign` on Vue setup bindings and `useValidAnchor` on Astro shorthand.
All are recommended and domain-free, so they are active in `recommended` and both
`-stable` variants — presets whose rule lists this pass does not touch at all.

The TypeScript overload-generics fix is the one that reaches this package's
actual audience, and it is invisible to every diff the pass runs. It belongs in
the changeset above the new rule.

### 4. The `-stable` variants do not move, and the changeset says so

`react-strict-stable` and `react-balanced-stable` stay at **180**, and the stable
relaxation subset stays at **15**, because the added rule and its relaxation are
both nursery. A reader who sees "262 → 263" will reasonably expect "180 → 181";
the changeset and the README should make the asymmetry explicit rather than leave
it to be inferred.

## Risks / Trade-offs

- **The rule is nursery and may change under consumers.** → Inherent to the
  opt-in stance, and `-stable` consumers are unaffected by construction.
- **If Biome later resolves custom properties project-wide, `off` becomes
  wrong.** → Recorded here so a future pass re-tests the fixture rather than
  inheriting the verdict. The requirement this change adds mandates that test.
- **More README edit sites than previous passes.** → That is the new invariant
  working; `check:presets` names each stale site, so the risk is effort, not
  silence.
- **`CLAUDE.md`'s relaxation count is a duplicate nothing checks.** → It must be
  updated by hand this pass. Flagged rather than fixed here.

## Migration Plan

Ordered by the dependency in the Context diagram: dependency bump and install
first, then `$schema`, then the metadata sweep, then the rule, then
`sync-stable`, then the README and `CLAUDE.md`. Running the sweep before the
`$schema` edit fails by design; running it before the install fails for the
opposite reason.

Rollback is reverting the commit. Consumers on `-stable` see no rule-list change
either way.
