# Intent

## Problem

`@dvashim/biome-config` promises its consumers presets reconciled against a named
Biome release, and tells them which release to install. That promise is now one
release out of date.

- The presets and the README name **Biome 2.5.13**. Biome **2.5.14** has been the
  current stable release since **2026-09-16**, and the README's own install
  instruction (`^2.5.13`) already resolves to it — so a consumer who follows the
  instructions runs a release these presets were never checked against.
- 2.5.14 introduces **8 new lint rules**. None is enabled, and none is recorded as
  deliberately left out. The strict and balanced presets are documented as
  configuring every non-recommended rule that applies, so their consumers silently
  miss the new ones.
- It gives one rule the presets already enable a **new setting**, and no decision
  about it is on record.
- It changes what several already-enabled rules report and how the formatter prints
  some code. Consumers of **all six** presets will see their output move on code
  they did not touch, with nothing from this package explaining why.
- The repository cannot see any of this. Its checks pass against its recorded rule
  catalogue, which still describes 2.5.13 (538 rules, 0 unaccounted), and the check
  that would flag the mismatch is **switched off** until the versions agree — an
  automated dependency update (PR #212) moved the repository's own Biome to 2.5.14
  while the presets stayed behind.
- The README already publishes one wrong number. Its React strict section says the
  preset adds **263** rules; the preset lists **274**. The last update missed it, and
  no check covers that sentence, so the package page on npm carries it today.

This recurs with every Biome release — five between 2026-08-21 and 2026-09-16.
This is the routine pass for 2.5.14.

## Who is affected

- **Consumers of `react-strict` and `react-balanced`** — they miss the new rules
  today, and receive them as new diagnostics once this ships.
- **Consumers of every preset**, `recommended` and the `-stable` variants included —
  Biome's own behaviour and formatting changes reach them whether or not a rule list
  moves. Teams whose CI fails on warnings feel it first.
- **Anyone choosing a Biome version or a preset from the README or the npm page** —
  the version guidance and the published rule counts.
- **The maintainer** — the drift check stays inert until the versions agree.

## Outcome

- The presets, the repository's own configuration, and the README all name Biome
  2.5.14 as the target, and agree with one another.
- Every rule 2.5.14 introduces is either enabled in the strict and balanced presets
  at a deliberate level, or left out with the reason on record. None is simply
  missing.
- The new setting on an already-enabled rule has a recorded decision.
- The package's next release tells consumers what changes for them: the new rules,
  any the balanced preset softens, and the behaviour changes inherited from Biome
  that would otherwise arrive unexplained.
- Every rule count the README publishes matches the presets — including the one
  that is wrong today.
- The drift check runs again.

## Success signal

- The repository's full check passes **with the rule-catalogue drift check
  running**, not skipped.
- **0** of the **546** rules Biome 2.5.14 declares are unaccounted for.
- Nothing outside history (the changelog, archived changes) still names 2.5.13 as
  the target.
- No rule total in the README disagrees with the preset it describes.
- The `-stable` presets list the **same 180 rules** they list today.
- A published release of the package whose changelog names each new rule and each
  inherited behaviour change a consumer would notice.

## Constraints

- The standing coverage requirements in
  `openspec/specs/linter-rule-coverage/spec.md` — which rules belong, how new ones
  are leveled, how the README stays in sync, how a release is sized — apply
  unchanged. This change works within them.
- Consumers who chose a `-stable` preset opted out of experimental rules. The update
  respects that choice.
- A consumer needs no change to their own configuration for it to keep working
  after upgrading the package.
- No deadline.

## Non-goals

- Any Biome release newer than 2.5.14. If one ships before this is released, it
  gets its own pass.
- Dev-tooling currency — pnpm, the other dev dependencies, the OpenSpec CLI — which
  has its own capability and its own passes.
- Re-leveling rules the presets already enable, or revisiting the scope policy, for
  any reason other than a change 2.5.14 makes.
- Svelte- and Vue-specific rules, which the presets exclude by policy.
- Shielding consumers from Biome's own behaviour changes. The package discloses
  them; it does not suppress them.

## Open questions

- **The requested solution** was "update Biome to the latest version and sync all
  configs and docs with this update." Confirm that means Biome 2.5.14 (npm `latest`
  on 2026-09-26), and that "configs and docs" covers the six presets, the
  repository's own configuration, the README, and the rule catalogue the checks
  read — with the contributor guide (`CLAUDE.md`) changing only if something it
  states stops being true.
- **How loud each new rule is will not be known until it is measured.** Accept that
  each new rule's level — and whether the balanced preset softens it — is settled
  in design under the standing convention, with the evidence recorded, rather than
  decided here.
- **Inherited behaviour changes will move consumers' output even where no rule list
  changes.** Accept disclosure in the release notes as the response, rather than
  holding the update back.

## Approval

- **Status**: accepted
- **Originator**: Aleksei Reznichenko
- **Approver**: Aleksei Reznichenko, maintainer of `@dvashim/biome-config`
- **Accepted on**: 2026-09-26
- **Supersedes**: none
