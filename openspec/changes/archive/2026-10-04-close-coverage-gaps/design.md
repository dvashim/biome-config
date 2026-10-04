# Design

## Context

For motivation, see `intent.md` (Slice) and `proposal.md` (Why). Three mechanisms
let the build pass an update that leaves a release's related rules behind. Each
one was reproduced on 2026-09-26 in a scratch copy of the repository, which has
Biome 2.5.14 installed and pinned.

**1. Coverage's recommended exemption has no category guard.**
`scripts/check-presets.ts` accounts for a rule with
`meta.recommended && meta.domains.length === 0`. The Redundancy invariant applies
the same test and additionally skips `nursery`. `biome explain` reports 11 of the
119 nursery rules in 2.5.14 as recommended: `noImpliedEval`,
`noInvalidPropertyInitValue`, `noJsonUnsafeValues`, `noReturnInFinally`,
`noUnsafeIframeSandbox`, `noXorAsExponentiation`, `useConsistentObjectKeys`,
`useDomNodeTextContent`, `useFlatMathMinMax`, `useMathMinMax`, and
`useModernMathApis`. All 11 are domain-free, and all 11 are listed today.

| Reproduction | Result |
|---|---|
| The six rules the 2.5.14 pass added removed from `react-strict` and `react-balanced` | Coverage names 3: `noObsoleteTags`, `useConsistentFunctionStyle`, `useValidTestTitle`. It misses `noJsonUnsafeValues`, `noReturnInFinally`, and `useConsistentObjectKeys`. |
| Synthetic unlisted rule added to the snapshot: nursery, domain-free, `recommended: true` | Passes: `547 rules classified, 280 listed, 0 unaccounted` |
| The same synthetic rule with `recommended: false` | Fails: `coverage: 1 rule(s) awaiting classification` |
| `setTimeout("alert(1)", 0)` under `"preset": "recommended"` | `noImpliedEval` is silent. It reports only once listed explicitly. |

The 2.5.14 design expected that "coverage fails naming the six in-scope rules".
The pass found all six only because it also diffed the schemas by hand.

**2. The snapshot check goes inert whenever the versions differ.**
`scripts/sync-rule-metadata.ts --check` prints `skipped: …` and exits 0 whenever
the version of the binary it would sweep differs from the pinned target. Its write
mode refuses in the same situation and suggests
`--biome "pnpm dlx @biomejs/biome@<target>"`. In a scratch copy, every `$schema`,
the README version references, and the snapshot's `biomeVersion` were relabelled
to `2.5.15` with no re-sweep. `check:presets` then reported
`presets check out against Biome 2.5.15: 546 rules classified, 280 listed, 0
unaccounted`, and `check:rule-metadata` skipped. The rule names for a version
other than the installed one already come from
`https://biomejs.dev/schemas/<version>/schema.json` (`readRuleNames`).

**3. The sweep enumerates a fixed category list.** `CATEGORIES` names eight
`$defs` entries. The schema declares its categories as the properties of
`$defs.Rules`: `a11y` → `SeverityOrA11y` → `anyOf [GroupPlainConfiguration,
A11y]` → `$defs.A11y.properties`. Beside the eight categories, `Rules` carries the
two non-rule keys `preset` (a string enum, `PresetConfig`) and `recommended` (a
boolean). Each category group carries the same two, and `NON_RULE_KEYS` already
filters them there.

**Cost of the fetched path.** `node scripts/sync-rule-metadata.ts --check --biome
"pnpm dlx @biomejs/biome@2.5.14"` took 23.6 s wall-clock and reported
`matches Biome 2.5.14 — 546 rules`. The installed binary took 11.2 s. A cold
`pnpm dlx @biomejs/biome@2.5.13 --version` took 0.6 s, and a warm one 0.2 s.

## Goals / Non-Goals

**Goals:**

- Coverage and Redundancy agree on what the recommended set activates.
- The snapshot is verified against the pinned release on every run, and
  regeneration writes that release whatever version is installed.
- Every category the release's schema declares is swept. A declared key that
  yields no rules stops the sweep instead of being dropped.
- `audit/rule-metadata.json` regenerates byte-identical at 2.5.14. When the
  installed binary is the pinned release, the check needs no network and behaves
  as it does today.

**Non-Goals:**

- Detecting that a newer Biome release exists, or that the presets lag it. The
  shared intent leaves how soon a release must be taken up unset, so nothing here
  watches npm or fails on lag.
- Checking the changelog against Biome's release notes. That is still an open
  question in the shared intent.
- Changing what the snapshot records, the scope sets (`IN_SCOPE_LANGUAGES`, the
  domain sets), the exclusion ledger, or any invariant other than Coverage.
- Mechanizing the per-hop audit for multi-release passes. It stays a by-hand
  audit under its own requirement.
- Letting `check:presets` read the network or run the Biome binary. It still reads
  only committed files.
- Editing the workflows. The `check:*` fan-out already runs `check:rule-metadata`
  on every PR and before every release.

## Prior decisions

No ADRs bind this design: `docs/adr/` does not exist yet.

Two standing decisions, recorded in `linter-rule-coverage` and `CLAUDE.md` rather
than as ADRs, still bind it and are kept:

- The snapshot describes the release the presets **target**, not the installed
  binary.
- The split state after an automated bump is the trigger for a version-tracking
  pass, not a defect, so CI must not fail merely because it exists.

This design changes only what followed from them: "therefore the sweep refuses,
and `--check` skips". The adr step records the replacement.

## Decisions

### 1. One predicate decides what the recommended set activates

A rule counts as active via `recommended: true` only when it is recommended,
domain-free, **and not in `nursery`**. Coverage and Redundancy both call a single
helper that expresses this. Today they state the test twice, which is how they
came to disagree.

- *Alternative: rewrite nursery rules to `recommended: false` in the snapshot.*
  Rejected. The snapshot records what Biome reports. The "nursery rule reported as
  recommended is not redundant" scenario depends on the flag being faithful, and
  fixing one consumer by editing the data would hide the discrepancy from the
  next reader.
- *Alternative: exempt the 11 known rule names.* Rejected. It is a list kept
  beside the metadata, and it would miss the next release's rules, which are
  exactly the ones this change is for.

No current verdict changes, because every rule the new guard stops exempting is
already listed.

### 2. Resolve a binary of the pinned release, then sweep and serialize with it

Both modes, `--check` and write, obtain the binary through one resolution, in this
order:

1. **`--biome <command>`**, when given. The override keeps its use for bootstrap
   and back-fill, but the version it reports must equal the pinned target. If it
   does not, the run fails; it never sweeps another version into the snapshot or
   compares against one.
2. **The installed binary**, when its version is the pinned target. This is
   today's path: no network, 11 s.
3. **Otherwise `pnpm dlx @biomejs/biome@<target>`.** This is the path already used
   for back-fills, measured at 24 s. If it cannot be obtained — offline, or never
   published — the run fails with
   `could not obtain Biome <target> to verify audit/rule-metadata.json`, followed
   by the underlying error.

The `skipped:` branch and the write-mode refusal are removed. Output names the
binary used, e.g. `… matches Biome 2.5.14 (installed) — 546 rules`, so a log shows
whether the release had to be fetched.

**Serialization uses the same binary.** `serialize` currently pipes through
`pnpm exec biome check --write`, the installed Biome, and the check compares
bytes. If a newer installed Biome ever sorted or formatted JSON differently from
the pinned one, the split state would report drift on a correct snapshot. That
would redden the Dependabot PRs the standing decision says must stay green.
Sweeping and serializing with one binary makes the check byte-exact against what
regeneration under the same resolution writes. A formatter difference between
versions would still surface through `check:format`, as it does today for every
file in the repository.

- *Alternative: fail when the installed binary is older than the target, and keep
  skipping when it is newer.* This closes the relabelling hole only while the
  binary lags. It leaves the Dependabot state unverified, along with a pass that
  deliberately targets an intermediate release below the installed binary, such as
  one hop of a multi-release catch-up. Rejected.
- *Alternative: fail whenever the versions differ.* This contradicts the standing
  decision and would redden every automated Biome bump. Rejected.
- *Alternative: install the target once into a temporary directory and call its
  binary directly.* It is roughly twice as fast in the split state, and it would
  read the package's own `configuration_schema.json` instead of biomejs.dev. It
  also adds a temp-directory lifecycle and a second install path. At 24 s it is not
  needed, so it is deferred (Open Questions).
- *Alternative: compare parsed JSON instead of bytes.* This removes the formatter
  concern, but it drops the byte-exact comparison that also pins the snapshot's
  key order, which `pnpm run check` verifies nowhere else. Rejected.

### 3. Categories come from `$defs.Rules`

The sweep reads the keys of `$defs.Rules.properties`, minus `NON_RULE_KEYS`, as the
categories. For each one it follows `$ref`s, through `anyOf` and `oneOf`, to the
definitions that carry `properties`, and collects the rule names there, again minus
`NON_RULE_KEYS`. If a key yields zero rules, the sweep fails naming it, both in
write mode and under `--check`.

Every key that is not a known non-rule key is therefore treated as a category. If
a future schema adds another non-rule key to `Rules`, the sweep fails and names
it, and the pass adds the key to `NON_RULE_KEYS`: a one-line, reviewed decision
instead of a silent omission.

- *Alternative: keep the list and fail on any unrecognised key.* That is still a
  list kept beside the schema, which the new requirement rules out, and each new
  category would need a code edit before its rules are seen at all. Rejected.
- *Alternative: derive the definition name by capitalising the key (`a11y` →
  `A11y`).* That relies on a naming convention Biome does not promise, while the
  `$ref` it does publish is available. Rejected.

The rule names for a fetched release keep coming from its published schema at
biomejs.dev (`fetchSchema`), so both paths enumerate the same document the same
way.

### 4. Documentation moves with the behavior

`CLAUDE.md` is corrected in four places:

- **Commands list.** `pnpm sync-rule-metadata` no longer needs `--biome` when the
  versions differ.
- **The `audit/` section.** The "refuses … skips" paragraph becomes "verified
  against the target on every run, fetched when needed". It says that network
  access is then required, and gives the timing.
- **The `biome explain` bullet.** The nursery guard applies to Coverage as well as
  Redundancy, with the 2.5.14 evidence.
- **The version-upgrade convention.** Regeneration is no longer conditioned on the
  target and the binary agreeing.

No changeset: nothing in `dist/*.json` or `README.md` changes, which the standing
changeset-sizing requirement treats as no release.

## Constraints check

The shared intent records no constraints. It lists the ones it considered with the
originator and ruled out, and each is unaffected here:

- **Teams' own additions and overrides keep working.** No published file changes.
- **Updates starting to fail teams' checks.** Consumers' diagnostics do not move,
  because no preset changes.
- **Security or compliance review of new versions.** Not a constraint. For the
  record: in the split state, CI now downloads the Biome release the presets
  already pin, from the same registry the repository installs from, under the
  existing `harden-runner` egress audit.
- **Lint run time.** Consumers' lint runs are untouched. Only the repository's own
  check changes: +13 s, and only in the split state.
- **Deadlines.** None.
- **Dependencies on other teams.** None. The fetched path depends only on npm and
  on Biome's published schemas, which the sweep already fetches.

The intent's non-goals also hold. No scope set changes, so no rule for a group the
package does not ship becomes listable, and nothing touches teams' configs.

## Risks / Trade-offs

- [`pnpm run check` needs network in the split state; an offline local run then
  fails] → The failure names the release it could not obtain. With the versions
  level, the common case, no network is used. An unverified pass is the defect
  this change removes, so failing is the intended trade.
- [An npm or biomejs.dev outage reddens PRs opened during the split state] → Rerun
  the job. The message names the unreachable release, so it cannot be mistaken for
  drift.
- [Parallel `pnpm dlx` launches could race to populate a cold cache] → The version
  probe runs once, sequentially, through the same command before the sweep starts,
  so the cache is warm by then. The tasks verify this against a release never
  fetched before on the machine.
- [A non-rule key added to `$defs.Rules` fails every regeneration until it is
  classified] → Intended. It names the key, and the fix is one line.
- [Serializing with a fetched binary makes regeneration in the split state
  slower] → About 5 more `pnpm dlx` launches. It is negligible next to the sweep.
- [The Coverage fix could flag rules nobody expected] → It changes no verdict today:
  all 11 recommended nursery rules are listed. `pnpm run check` must still report
  `0 unaccounted` of 546.

## Migration Plan

Land through a PR to `main` with no changeset, so the merge publishes nothing.
Roll back by reverting the PR; no published artifact or data depends on it. The
snapshot is unchanged byte for byte, so there is nothing to migrate. The next
version-tracking pass is the first to rely on the closed gaps.

## Open Questions

- Whether to replace the per-invocation `pnpm dlx` path with a one-time install
  into a temporary directory (Decision 2) to halve the split-state sweep. This can
  be decided later without changing the specs or the tasks.
