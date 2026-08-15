## Context

See `proposal.md` — Why. The constraints that shape this pass:

- The presets pin `$schema` at **2.5.7** in seven files; npm `latest` and the
  declared `@biomejs/biome` range are both **2.5.8**. The standing requirement
  resolves this split explicitly: presets lagging, target advances.
- `react-strict` currently lists **258** rules (nursery 76); `react-balanced`
  lists the same set with 16 relaxations; both `-stable` variants hold **182**.
- The presets set **no `domains` key**. Every framework rule is activated by being
  listed individually, which for most domain rules means Biome's dependency gating
  never applies. Measurement during implementation showed this is not universal:
  `useReactCompiler` re-checks for `react` itself and stays silent without it,
  while `noImgElement` and `useExhaustiveDependencies` both fire either way.
- The 2.5.7 → 2.5.8 rule-key diff is small and fully enumerated: three nursery
  additions, zero removals, zero renames, zero graduations.

## Goals / Non-Goals

**Goals:**

- Every consumer-facing reference to the Biome version reads 2.5.8, with no file
  left behind — the failure mode this repo has hit before.
- The two in-scope additions land at severities that follow the house convention
  and are justified per preset, not copied from upstream defaults.
- The README's published counts stay exactly reconcilable with what the presets
  hold, including the two relaxation counts that now diverge.

**Non-Goals:**

- Adopting `useReactCompiler`'s `compilationMode` option. The `infer` default is
  the intended scope; setting it explicitly would freeze a value that merely
  restates the default, against the standing convention.
- Enabling `noSvelteLegacyConst`, or revisiting the excluded-domain list generally.
- Any change to the shared `formatter` / `assist` / `files` / `javascript` /
  `json` / `html` / `vcs` blocks — the option audit found nothing new in them.
- Re-bumping `@biomejs/biome`; the range is already `^2.5.8`.

## Decisions

**`useReactCompiler` is `warn` in strict and `off` in balanced.**
The house convention says balanced relaxes purely stylistic, high-noise, or
broadly-firing rules to `info` or `off`. This rule is the strongest instance of
"broadly firing" the presets have met: it reports the gap between a codebase and
an architectural opt-in, so on a React project that has not adopted React
Compiler a large share of components report while nothing is wrong with any of
them — 100 diagnostics across a 60-file fixture, measured. `info` was the
alternative — it keeps the signal visible for teams evaluating adoption — but
`info` still puts a diagnostic on every affected component, which is precisely the
noise balanced exists to remove. `off` is also recoverable in one line by a
consumer who wants it, whereas noise is not.

**The audience for this rule is narrower than the presets' usual reach, and that
was established by measurement.** The pass initially assumed explicit listing
would defeat the react domain gate, as it does for every other domain rule the
presets list. It does not: with an identical config, `useReactCompiler` reported 0
diagnostics without `react` in `package.json` and 3 with it, while `noImgElement`
and `useExhaustiveDependencies` were unaffected by their gating dependency. The
severity split above is unchanged by this, but its justification is — the rule is
noisy for React consumers who have not adopted the compiler, not costly for
everyone.

**`noInvalidPropertyInitValue` is `warn` in both presets, with no relaxation.**
It fires only inside CSS `@property` at-rules and reports a genuine, silent
failure — the browser declines to register the custom property at all. Narrow
surface plus real breakage means neither the high-noise nor the stylistic
relaxation criterion applies, so balanced matches strict.

**Both rules are listed even though one is marked *recommended*.**
`noInvalidPropertyInitValue` reports as recommended, which would normally make it
redundant under the "redundant recommended rules are not enumerated" requirement.
That requirement is scoped to recommended **stable** rules; this one is nursery,
and `recommended: true` never activates nursery. Listing it is required, not
redundant — and it is what makes the rule disappear from the `-stable` variants,
which is correct, since those track Biome's recommended baseline.

**`noSvelteLegacyConst` is excluded, and the exclusion is recorded rather than
silent.** Its only domain is `svelte`. The standing requirement names svelte among
excluded framework-only domains, so this needs no judgment call — but the pass
records it so a later audit diffing 2.5.8's rule set against the presets can see
the rule was considered and rejected, not missed.

**The delta is about how gating behavior is established, not about severity.**
The severity call above is already covered by existing requirements. What is not
covered — and what this pass got wrong before measuring — is that the standing
requirement asserts a listed domain rule applies "regardless of the consumer's
dependencies" as though it were universal. It holds for every other rule tested
but not for this one. The delta qualifies that requirement and adds the method
that would have caught it: run the rule with and without its gating dependency and
record what happens, rather than inferring from sibling rules.

**Ship as `minor`.** Preset rule lists change, which the standing requirement pins
as the minor case regardless of the `$schema` advance riding along.

## Risks / Trade-offs

**`useReactCompiler` adds run time for `react-strict` consumers who have React.**
→ Measured rather than assumed: a 60-file React fixture went 99 ms → 115 ms
(+16%), and a 60-file non-React fixture went 91 ms → 94 ms with zero diagnostics,
because the rule self-gates. A 16% lint-time increase on React sources is present
but not severe, so `react-strict` keeps it at `warn`. The fixture is synthetic and
small; a very large React codebase could scale differently, which is a reason for
consumers to know the rule is there, not a reason to withhold it from strict.

**Turning a rule fully `off` in balanced sets a second nursery precedent.** →
Already sanctioned: the "Balanced relaxations may live in nursery" requirement was
added for `noTailwindArbitraryValue`, and the README already reports the two
relaxation counts separately. This pass extends the counts (16 → 17 total, 15
stable-category) rather than introducing a new shape.

**README count drift is the recurring failure mode of this pass.** → Five distinct
figures move (total 258 → 260 twice, nursery 76 → 78 twice, relaxations 16 → 17)
and three prose statements reconcile them. The task list verifies each count
against the preset with the documented one-liner rather than by eye.

**The `$schema` bump touches seven files and the README five times.** → The last
pass's split state happened because a dependency bump moved without them. Tasks
verify by grepping for any surviving `2.5.7` reference rather than by editing a
remembered list of paths.
