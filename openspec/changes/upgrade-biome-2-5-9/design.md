## Context

See `proposal.md` — Why. The constraints that shape this pass:

- The presets pin `$schema` at **2.5.8** in seven files; npm `latest` and the
  declared `@biomejs/biome` range are both **2.5.9**. The standing requirement
  resolves this split explicitly: presets lagging, target advances.
- `react-strict` currently lists **260** rules (nursery 78); `react-balanced`
  lists the same set with **17** relaxations; both `-stable` variants hold **182**.
- The presets set **no `domains` key**. Every framework rule is activated by being
  listed individually, which for most domain rules means Biome's dependency gating
  never applies — `useReactCompiler`, measured during the 2.5.8 pass, remains the
  only known exception.
- The 2.5.8 → 2.5.9 rule-key diff is small and fully enumerated: five nursery
  additions (517 → 522 rules), zero removals, zero renames, zero graduations.
- Four of the five are in scope. The fifth is the first member of an exclusion
  clause the spec already carried: 2.5.9 introduces Biome's `astro` domain, and
  the requirement excluding astro-only rules predates the domain's existence.

## Goals / Non-Goals

**Goals:**

- Every consumer-facing reference to the Biome version reads 2.5.9, with no file
  left behind — the failure mode this repo has hit before.
- The four in-scope additions land at severities that follow the house convention
  and are justified per preset from measurement, not from upstream defaults.
- The README's published counts stay exactly reconcilable with what the presets
  hold, including the two relaxation counts that continue to diverge.
- The bump's largest consumer-visible effect — HTML formatter output — reaches the
  changeset, not just the rule list.

**Non-Goals:**

- Setting any `options` block. All four additions declare empty options objects;
  there is nothing to configure even if the presets wanted to.
- Enabling `useAstroClientOnlyDirectiveValue`, or revisiting the excluded-domain
  list generally.
- Any change to the shared `formatter` / `assist` / `files` / `javascript` /
  `json` / `html` / `vcs` blocks — the option audit found nothing new in them.
- Re-bumping `@biomejs/biome`; the range is already `^2.5.9`.
- Suppressing or configuring around 2.5.9's HTML formatter changes. The presets
  track upstream formatting; the change discloses the movement instead.

## Recorded measurements

Both experiments below were run with the installed 2.5.9 binary against a config
in the presets' shape — explicit `linter.rules` listing, `recommended: false`, and
**no `domains` key** — so the results describe what a preset consumer actually
gets. They are recorded here because the standing requirements ask for the
*observation*, and because re-deriving them later is wasted work.

**Gating — `useTailwindShorthandClasses` defeats its dependency gate.** Two
fixtures identical but for `tailwindcss` in `package.json`, each with a JSX file
containing `className="w-4 h-4 mt-2 mb-2 pl-3 pr-3"`:

| Fixture | `tailwindcss` in `package.json` | Diagnostics |
|---|---|---|
| `nodep` | absent | **3** |
| `withdep` | present | **3** |

Explicit listing defeats the gate, as it does for every domain rule tested except
`useReactCompiler`. The rule therefore reaches every consumer.

**Volume — all four candidates at `warn` over 443 files of real React/TypeScript
library code** (`matkon`, `charts`, `ui`; includes 50 CSS files and 8 files
containing `<button`, none using Tailwind):

| Rule | Diagnostics |
|---|---|
| `noUnsafeTypeAssertion` | **72** (matkon 49/280 files, charts 20/103, ui 3/60) |
| `useTailwindShorthandClasses` | 0 |
| `useControlLabel` | 0 |
| `useNamedLayer` | 0 |

The three zeroes are silence, not inertness. A fixture confirms each fires on its
bad case and stays quiet on the good ones: `useControlLabel` reports `<button />`
and passes `aria-label`, a text child, a component child, and `title`;
`useNamedLayer` reports `@layer { … }` and passes `@layer base { … }`.

**What `noUnsafeTypeAssertion` actually flags.** The 72 diagnostics span 66
distinct lines. Representative:

```
s.domain() as [Date, Date]                          // d3 types return Date[]
Object.entries(names) as [keyof T & string, …][]    // TS returns [string, V][]
children.props as AnyProps                          // slot / polymorphic forwarding
(action as (prev: T) => T)(state)                   // generic reducer dispatch
null as unknown as { name: string }                 // deliberate ref / context init
(await res.json()) as RawKline[]                    // res.json() is any
```

Substantially none are reachable by the alternatives the rule's own documentation
recommends. `satisfies`, type predicates, and assertion functions all narrow a
type the local code owns; these assertions bridge a gap in a third-party or
generic type, which is why they are written as assertions in the first place.

## Decisions

**`noUnsafeTypeAssertion` is `warn` in strict and `off` in balanced.**
At ~1 diagnostic per 6 files in library-grade TypeScript, with essentially no
actionable subset, this is the balanced preset's "the pattern is legitimate and we
do not want to be told" case — structurally the same call as `noImplicitCoercions`
(`off`, "too noisy with `!!value` patterns"). `info` was the alternative and was
rejected: `info` does not remove the 72 lines, it re-labels them, establishing a
permanent noise floor that trains consumers to filter the preset rather than read
it. `off` is recoverable in one line by a consumer who wants the rule, and the
README relaxation table makes it discoverable. Strict keeps `warn` because strict's
contract is that its consumers opted into exactly this kind of pressure — and the
rule is not wrong, merely relentless.

**`useTailwindShorthandClasses` is `warn` in both — reach was measured, and did
not imply noise.** The gate is defeated, so the rule reaches consumers who do not
use Tailwind. Under the existing requirement that pairs "gate defeated" with
assessing outside-framework noise, the obvious next step would be a balanced
relaxation, as with `noImgElement`. The measurement says otherwise: the trigger
pattern is *itself* Tailwind syntax, so a project without Tailwind offers nothing
to match, and the 443-file run — none of it Tailwind — returned zero. Reach and
noise came apart, which is what the modified requirement in `specs/` now records.
The rule is otherwise the structural twin of `useSortedClasses` (upstream `info`,
unsafe fix, `tailwind` domain), already at `warn` in both presets, so matching it
keeps the two Tailwind shorthand-style rules consistent. `noTailwindArbitraryValue`
sits at `off` for a reason that does not transfer: arbitrary values are a
sanctioned Tailwind escape hatch, whereas `w-4 h-4` is a longer spelling of
`size-4` with no defensive purpose.

**`useControlLabel` is `warn` in both.**
A control with no accessible name is a real defect, and the rule is built to avoid
guessing — anything it cannot resolve statically (an expression, a spread, a
custom component) is assumed to provide a label. Zero diagnostics across 8 files
containing `<button`, and the fixture confirms every reasonable labeling route
passes. Neither relaxation criterion applies. Note the rule covers plain HTML as
well as JSX, which matters for consumers using `html.experimentalFullSupportEnabled`.

**`useNamedLayer` is `warn` in both.**
CSS-only, fires solely on anonymous `@layer` blocks and `@import … layer`, zero
hits across 50 real CSS files. Narrow surface, real cascade consequence — the
layer takes a slot nothing can append to or reorder — so balanced matches strict.

**All four are listed as bare severity strings.**
Each declares `{"type":"object","additionalProperties":false}`. There is no option
to set, so the standing convention (inherit the upstream default unless the
preset's intent differs) is satisfied trivially, and every entry sorts among the
category's string-valued rules rather than after them.

**`useAstroClientOnlyDirectiveValue` is excluded, and the exclusion is recorded
rather than silent.** Its only domain is `astro`, which the standing requirement
already names among excluded framework-only domains — no judgment call. It is
recorded so a later audit diffing 2.5.9's rule set against the presets can see the
absence was decided rather than missed.

**The HTML formatter changes are disclosed, not absorbed.**
Six 2.5.9 changes alter HTML formatter output, and all six presets configure
`html`. The rule-list change would otherwise dominate the changeset copy while the
formatter movement — which reaches `recommended`, `react-recommended`, and both
`-stable` presets, none of whose rule lists move — went unmentioned. The added
requirement in `specs/` makes that disclosure standing rather than incidental.

## Risks / Trade-offs

- **`noUnsafeTypeAssertion` at `warn` will be loud for `react-strict` consumers.**
  → That is the preset's stated contract, the measurement is published in the
  proposal so the impact is not a surprise, and `react-balanced` exists precisely
  as the escape. A consumer who wants strict-minus-this-rule sets one key.
- **`react-balanced` consumers never discover `noUnsafeTypeAssertion` exists.**
  → The README relaxation table names every `off` rule with its reason; this is
  the same trade already accepted for eight other rules.
- **The gating measurement is a snapshot of 2.5.9 behavior.** A later Biome release
  could make `useTailwindShorthandClasses` self-gate, as `useReactCompiler` does.
  → The requirement mandates re-measuring per pass rather than inheriting the
  finding, so a change in upstream behavior surfaces at the next upgrade.
- **The volume measurement is drawn from library-style React/TypeScript, which
  leans on type assertions more than application code.** → It is the population
  this repo's presets actually serve, and it biases toward the conservative
  choice: if anything, application code sees fewer diagnostics, which does not
  weaken the case for `off` in balanced.
- **Consumers formatting HTML get a one-time diff on upgrade.** → Unavoidable, and
  inherited rather than caused; the changeset names it so the diff is expected.

## Migration Plan

None for consumers beyond the version bump itself: no rule is removed or renamed,
no option changes, and the four additions are nursery, so `-stable` consumers are
unaffected apart from the `$schema` line. Rollback is a Changesets revert plus
restoring the `$schema` URLs; nothing in the change is stateful.
