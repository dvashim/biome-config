# Design: mechanize-rule-audit

## Context

See `proposal.md` — Why for the motivation and the measured feasibility numbers.

The constraints that shape the approach:

- **The repo has one script and no test suite.** `scripts/sync-stable.ts` runs on
  Node's native type stripping (`engines: node >= 24`) and is type-checked by
  `check:types`. It is also the repo's only worked example of the pattern this
  change extends: derive an artifact mechanically, commit it, and add a `--check`
  mode that fails the build on drift.
- **`pnpm run check` fans out over `check:*`** and runs in CI on every PR to
  `main`. Anything named `check:*` is therefore a merge gate by construction.
- **Rule metadata is only available by asking the binary.**
  `configuration_schema.json` ships in the package and yields the rule set and
  categories, but carries no recommended status, no domains, and no severities.
  Those come from `biome explain <rule>`, one rule per invocation, as
  human-readable text with no `--json` and no bulk mode.
- **Dependabot moves `@biomejs/biome` on its own schedule**, ahead of the presets.
  The `Presets track the latest stable Biome release` requirement already treats
  that split state as normal and as the trigger for a pass — so any check that
  fails on it would redden CI for a condition the spec calls expected.

## Goals / Non-Goals

**Goals:**

- Every invariant in `Mechanically decidable preset invariants are enforced by the
  build` is enforced offline, deterministically, and fast enough to sit in the
  `check:*` fan-out.
- The rule-metadata delta between two Biome releases becomes a reviewable diff in
  the upgrade PR, rather than something each pass re-derives from the network.
- A pass moves the presets, the pinned target, and the metadata together, or the
  build tells it what it missed.

**Non-Goals:**

- **No network access in any check.** Currency — comparing the pinned target to
  the npm `latest` dist-tag — stays a pass activity, because it needs the network
  and because the spec deliberately keys it to `latest` rather than to anything
  present in the repo.
- **No judgment is mechanized.** Noise measurement, dependency-gate probing,
  balanced relaxation calls, and reading release notes stay human. The checks
  establish that the rule list is *complete and consistent*, never that it is
  *well-tuned*.
- **No preset content changes.** This design must leave every `dist/*.json` file
  byte-identical.

## Decisions

### 1. A committed metadata snapshot, not a live sweep

The sweep writes a snapshot — rule name, category, recommended flag, domains,
default severity, source Biome version — which is committed. The checks read the
snapshot; they never invoke Biome. Regenerating it is a command a pass runs,
mirroring `pnpm sync-stable`, with a `--check` mode for drift.

*Why:* three things fall out that a live sweep does not give.

- **The upgrade diff becomes reviewable.** "Which rules did this release add,
  rename, graduate, or drop" is the first three legs of every version-tracking
  audit. Against a committed snapshot it is `git diff`, in the PR, already
  reviewed. Against a live sweep it is a network fetch of the previous schema —
  which is precisely the manual step this change exists to remove.
- **CI stays hermetic and instant.** No sweep, no dependence on the binary being
  present or on `explain`'s output being stable in the CI image.
- **Dependabot stops being a build breaker.** This is the load-bearing reason.
  If the checks read the *installed* binary, the moment Biome ships a rule the
  coverage check fails on a PR that merely bumps a devDependency — turning a
  condition the spec calls normal into a red build. Reading a committed snapshot
  means the presets are checked against the version they claim to target. The
  binary running ahead is tolerated, exactly as the spec intends, and the pass is
  what moves both.

*Alternative — sweep on every run, commit nothing.* Simpler, one fewer generated
artifact, no drift check. Rejected: it costs the upgrade diff, and it makes every
Dependabot bump a red build.

### 2. No check compares the snapshot to the installed binary

Deliberately absent. The divergence it would report is the expected state between
passes, and the spec already assigns that comparison to a pass, against npm
`latest` rather than against the installed version.

*Alternative — report it without failing.* Rejected: a check that never fails is
a check nobody reads, and it would put a permanent notice in the output of a
green build.

### 3. But the pinned target must be internally consistent

The one currency-adjacent thing that *is* decidable offline: the version named by
the metadata snapshot, the `$schema` URL in all six `dist/*.json` presets and in
`biome.json`, and every version reference in `README.md` must agree with one
another.

*Why:* this catches the half-applied bump — a pass that updates six of seven
`$schema` URLs, or four of the README's seven references. That failure mode is
real: the README currently carries **seven** occurrences across five distinct
kinds of reference, and the `2.5.9` pass's own proposal counted five.

This resolves the fork `proposal.md` left open, and adds a seventh invariant to
the spec rather than leaving the decision implicit.

### 4. Parse `biome explain` text, and assert total coverage

There is no structured metadata API. The sweep runs the binary directly at
`node_modules/@biomejs/biome/bin/biome` — `pnpm exec` costs ~500ms per invocation
against ~65ms direct — fanned out in parallel, and parses the `Summary` and
`Domains` blocks plus the fenced examples.

The examples are what make the language exclusion derivable. Each fence names the
language it is written in (`graphql,expect_diagnostic`,
`ts,expect_diagnostic,file=invalid.ts`), and a fence carrying the `options`
modifier is the rule's own options sample rather than a code sample in the rule's
language. Measured against 2.5.9: **521 of 522** rules yield at least one example
language, and all **16** GraphQL-only rules are identified cleanly.

*Mitigation for the obvious fragility:* the sweep asserts it parsed metadata for
**100%** of the rules the configuration schema declares, and fails otherwise. A
format change upstream then surfaces as "parsed 400 of 530," not as a snapshot
that silently loses domains and quietly widens the coverage check's blind spot.

*Alternative — scrape biomejs.dev.* Rejected: network, and a second source of
truth that can disagree with the installed binary.

### 5. The exclusion ledger is an escape hatch, and it starts empty

A small committed file mapping rule name to the reason it is out of scope. It is
hand-edited; adding an entry is a deliberate act, reviewed like any other diff.

*Why it is empty:* an earlier draft of this design seeded it with the GraphQL
rules, on the premise that a rule's target language is published nowhere. That
premise was wrong — see Decision 4 — so every GraphQL rule is now excluded by
derivation and needs no entry.

*Why keep it:* derivation is not total. `noRestrictedTypes` publishes only an
options sample and no code example, so nothing in its metadata places it in or
out of scope. It happens to be listed in the presets already, so the coverage
check accounts for it that way and the ledger stays empty today — but a future
rule in that shape would otherwise hard-fail the build with no way to record a
decision short of listing a rule nobody wants. The ledger is what keeps
"deliberately excluded" distinguishable from "nobody has looked at it yet", which
is the distinction that makes the check a gate rather than a report.

*Why not put it in the spec:* specs state behavior; a list of rule names is data,
and it changes on Biome's schedule rather than on the spec's.

### 6. Follow the existing script conventions

TypeScript under `scripts/`, run by Node's native type stripping, type-checked by
`check:types`, with `--check` for drift. No new runtime dependency.

## Risks / Trade-offs

- **A third generated artifact, with its own drift check** → Mitigation: it is the
  same shape as `sync-stable`, which the repo already maintains and documents; the
  regeneration step joins the pass's existing checklist rather than forming a new
  one.
- **`biome explain`'s output format is undocumented and can change** → Mitigation:
  the 100%-parse assertion in Decision 4 converts a silent degradation into a hard
  failure.
- **The snapshot can be regenerated without the presets being reconciled**, leaving
  a passing build whose snapshot describes a release the rule lists were never
  audited against → Mitigation: regenerating is what *causes* the coverage and
  category checks to fail if the presets have not kept up; a snapshot bump alone
  cannot go green.
- **The README check couples a docs file to a build gate**, so a prose edit that
  touches a count can fail CI → Accepted: `README is part of the contract` is
  already the standing rule, and the counts are currently verified by running a
  one-liner by hand, which is the weaker guarantee.
- **The checks can create false confidence** — a green build says the rule list is
  complete and consistent, not that any severity is right. The `Deferred` section
  of `proposal.md` records the evidence that those are different questions.

## Migration Plan

1. Add the sweep and generate the first snapshot at the version the presets
   currently pin (**2.5.9**), not at the installed **2.5.10** — so the first
   commit records the state the presets were actually audited against, and the
   pending 2.5.10 pass shows up as a real diff rather than being absorbed silently.
2. Add the checks one at a time, confirming each passes against the current
   presets before the next. All seven are expected to pass today: the sweep
   already reports category drift 0, unknown-to-Biome 0, redundancy 0 (with the
   nursery guard), and identical strict/balanced rule sets.
3. Seed the exclusion ledger with the 14 GraphQL rules and confirm the coverage
   check reaches zero unclassified.
4. Update `CLAUDE.md`, whose "no build step and no test suite … the only
   executable code is `scripts/sync-stable.ts`" line this change falsifies.

Rollback is deleting the `check:*` entries from `package.json`; nothing in
`dist/` depends on any of it.
