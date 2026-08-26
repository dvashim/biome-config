# Proposal: mechanize-rule-audit

> Scope note: this change adds no rule to any preset and touches no `dist/*.json`
> file. It mechanizes the parts of a version-tracking pass that are decidable from
> Biome's own metadata, so that a pass spends its effort on the parts that are not.
> The feasibility numbers below were measured against the installed Biome 2.5.10,
> not estimated.

## Why

Nine version-tracking passes are archived, and every one of them re-derives the
same mechanical facts by hand: which rules the target release added, which were
renamed or removed, which graduated out of `nursery`, which in-scope rules the
presets are still missing, and whether the README's counts still match. The
`upgrade-biome-2-5-9` pass classified **262 unlisted rules** one at a time to
establish that zero in-scope gaps existed.

That work is decidable from data Biome already ships. A sweep of
`biome explain` over all **522** rules in the 2.5.10 schema takes **9.6 seconds**
wall-clock (`xargs -P 12` against `node_modules/@biomejs/biome/bin/biome`; going
through `pnpm exec` costs 7× more per invocation) and reproduces the last pass's
hand classification exactly:

| Bucket | Count | Decidable? |
|---|---|---|
| Listed in `react-strict` | 264 | — |
| Unlisted, recommended + no domain (active via `recommended: true`) | 205 | yes |
| Unlisted, framework-only domain (`vue` 33, `qwik` 6, `svelte` 3, `solid` 2, `solid`+`qwik` 1, `astro` 1) | 46 | yes |
| Unlisted, GraphQL-only by their published examples | 7 | yes |

All 258 unlisted rules classify themselves. Language is derivable after all,
though not from where one would first look: it is absent from
`configuration_schema.json` and from the summary `biome explain` prints, and only
5 of the 16 GraphQL rules so much as mention GraphQL in their schema description
— but every rule's documented examples are fenced with the language they are
written in. Measured against 2.5.9, **521 of 522** rules yield at least one
example language, and all **16** GraphQL-only rules are identified cleanly. Both
clauses of `Out-of-scope rules are excluded` are therefore enforceable.

The same sweep also settles the drift questions a pass currently answers by
reading diffs. Run against the current presets it reports **category drift 0** and
**unknown-to-Biome 0** across all four hand-maintained and generated files — which
is the graduation and rename/removal audit, already passing.

Two other things make the case now rather than later. The `2.5.10` bump waiting on
the `up` branch ships a schema **byte-identical** to `2.5.9` — so its entire
mechanical audit is empty, and a check would have said so in seconds. And the
pass's own bookkeeping is currently what crowds out its judgment work: no pass has
ever re-examined the severity of a rule it did not itself add.

## What Changes

- **Add a rule-metadata sweep** that reads `configuration_schema.json` for the
  rule set and `biome explain` for each rule's recommended status, domains,
  default severity, and diagnostic category, and caches the parsed result for the
  installed Biome version.
- **Add checks over that metadata**, wired into the existing
  `pnpm run "/^check:.*/"` fan-out:
  - **Coverage** — every rule is accounted for: listed in `react-strict`,
    recommended-with-no-domain, framework-only-domain, or named in the exclusion
    ledger. Anything else fails with *"N rules need classification"*.
  - **Category drift** — every listed rule sits in the category Biome reports for
    it, which is how a nursery graduation announces itself.
  - **Rename / removal** — a listed rule Biome no longer recognizes fails the
    check (`biome explain` exits 1 with *"Unrecognized option"*).
  - **Redundancy** — no listed rule is recommended, domain-free, non-nursery, and
    at its Biome default severity.
  - **Preset parity** — `react-strict` and `react-balanced` hold identical rule
    *sets*, differing only in severity and options.
  - **README inventory** — per-category counts equal what `react-strict` lists,
    every rule the README names exists in that preset, and the balanced
    relaxation table's totals reconcile against the presets (currently 18 and 15).
  - **Pinned-target consistency** — the rule metadata, the `$schema` URL in all
    six presets and in `biome.json`, and every README version reference name the
    same Biome release, so a half-applied bump fails rather than shipping.
- **Add an exclusion ledger** recording any rule the metadata cannot classify,
  with the reason for each. It starts **empty**: derivation covers every rule in
  2.5.9. It exists because derivation is not total — a configuration-required
  rule such as `noRestrictedTypes` publishes only an options sample and no code
  example — and it is what keeps "deliberately excluded" distinguishable from
  "nobody has looked at it yet", which is what makes the coverage check a gate
  rather than a report.
- **Do not** add a check that compares the pinned `$schema` target to the
  installed binary. That split state is exactly what the standing requirement
  wants surfaced, but a failing check would turn CI red on every automated
  devDependency bump until a pass runs, and a check that never fails is one
  nobody reads. `design.md` resolves this: the checks are keyed to the version the
  presets *target*, currency stays a pass activity against the npm `latest`
  dist-tag, and the offline half of the question is covered instead by the
  pinned-target consistency check above.

### Encoded knowledge these checks require

Three facts are not inferable from the metadata and must be written into the
checks deliberately, all three discovered by getting them wrong first:

- **`biome explain` reports nursery rules as "recommended."** `useMathMinMax` is
  nursery, flagged recommended, default `warn`, and listed at `warn` — which a
  naive redundancy check calls redundant. It is not: `recommended: true` never
  activates nursery, so the entry is load-bearing. With the nursery guard,
  `react-strict` has **zero** redundant entries.
- **A rule's language lives in its example fences, not its description.**
  Matching descriptions for "graphql" finds 5 of 16; reading the fenced examples
  finds all 16. The fence's `options` modifier marks the rule's own options
  sample, which is JSON for every rule and must not be read as its language.
- **`--config-path` to a directory outside the project breaks project-layout
  resolution.** Rules that resolve `package.json` — `noUndeclaredDependencies`,
  `noNodejsModules` — then misfire en masse (181 and 26 false diagnostics on a
  247-file corpus). Any check or measurement that lints a consumer tree must run
  from that tree's own root.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: gains **one added requirement** and **one modified
  requirement**.
  - *Mechanically decidable preset invariants are enforced by the build* (ADDED)
    — the spec states what must be true of the rule lists but nothing states that
    those conditions are verified rather than asserted. Every pass has re-derived
    them by hand and recorded the result in prose, which means a regression
    between passes is invisible until the next pass looks. This requirement names
    the invariants that are decidable from Biome's own metadata and requires the
    build to fail on drift, in the same way `check:sync-stable` already fails on
    `-stable` drift.
  - *Out-of-scope rules are excluded* (MODIFIED) — the requirement excludes two
    groups with one sentence, but only one of them is decidable. Framework-only
    domains come straight from `biome explain`; GraphQL-only does not, because
    target language is not published. The requirement gains the distinction and
    the ledger that carries the undecidable half, plus the failure behavior when
    a release adds a rule that fits neither branch.

## Impact

- **New tooling**: a metadata sweep and the checks above, alongside
  `scripts/sync-stable.ts`. This is a posture change worth naming — `CLAUDE.md`
  currently records that the repo has no build step and no test suite, and
  `sync-stable.ts` is its only executable code. That line becomes inaccurate and
  is updated in this change.
- **`package.json`**: new `check:*` scripts, picked up automatically by the
  existing `pnpm run "/^check:.*/"` fan-out and therefore by CI on every PR.
- **Runtime**: the sweep is the only slow part at ~10s; the checks over its output
  are instant. A cache keyed on the installed Biome version keeps repeat runs free.
- **Published package**: **unchanged**. No `dist/*.json` file and no README rule
  content is touched, so no changeset is created and no release is published —
  the `Version-tracking passes release according to their published impact`
  requirement's dev-only case. The README's rule inventory is *read* by the new
  check, not rewritten.
- **Specs**: `linter-rule-coverage` — one requirement added, one modified.
  `dev-tooling-currency` is untouched.
- **Not touched**: every preset rule list, `$schema` targets, the `-stable`
  generation path, CI workflow definitions, and the pending `2.5.10` bump, which
  remains a separate pass.

## Deferred

- **Two GraphQL rules are listed in the presets, against the standing
  requirement.** Deriving example languages surfaced a pre-existing violation of
  `Out-of-scope rules are excluded`: both presets list `useDeprecatedDate`
  (`warn`; not recommended; GraphQL-only) and `noDuplicateEnumValueNames`
  (`warn`; recommended with a `error` default, so a deliberate downgrade;
  GraphQL-only). Every example either publishes is GraphQL. Removing them changes
  preset rule lists and is therefore a `minor` release, which is outside this
  change's tooling-only scope. Note that the seven invariants above would **not**
  catch it — coverage accounts for *unlisted* rules, so a listed rule counts as
  accounted for whether or not it belongs. Catching it needs an eighth invariant
  in the opposite direction: every listed rule is in scope. A follow-up change
  should add that invariant and remove the two rules together, so the check does
  not land already failing.

- **Whether `react-balanced` is calibrated** is a real and separate question this
  exploration raised but did not settle. On 247 files of a first-party consumer,
  `react-balanced-stable` produces **329 diagnostics** where that consumer's own
  tuned config produces zero, and 81% of them come from six rules — `noHexColors`
  (106), `useComponentExportOnlyModules` (47), `useFilenamingConvention` (33),
  `noMagicNumbers` (31), `noImplicitBoolean` (29), `useTopLevelRegex` (20) — five
  of which `react-balanced` does not relax at all. That is one corpus, and an
  atypical one (a build-tool and styling-library monorepo), so it is evidence that
  the question is worth asking, not an answer. Measuring it properly needs the
  other consumer repos on a current preset first.
