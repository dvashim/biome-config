# Design: upgrade-biome-2-5-10

## Context

See `proposal.md` — Why. The mechanics of a version-tracking pass are established
by nine archived predecessors; what is new here is the tooling added by
`mechanize-rule-audit`, which changes both what this pass has to do by hand and
what the build will refuse to let it get wrong.

Two facts shape the whole change:

- **The rule audit is empty and provably so.** The 2.5.9 and 2.5.10
  configuration schemas are byte-identical, and a metadata sweep of both shows
  522 rules with no field differences. This is the first pass where the schema
  diff, the rule-key diff, and the metadata diff are all empty at once.
- **The build now catches a half-applied bump.** `check:presets` fails unless the
  snapshot's version, all seven `$schema` URLs, and every README target reference
  name the same release. That is fifteen edits this pass cannot silently miss.

## Goals / Non-Goals

**Goals:**

- The pinned target advances everywhere it appears, in one change.
- The empty rule audit is *recorded as a result*, with the evidence, rather than
  left as an absence a later reader would have to re-derive.
- What consumers actually inherit from 2.5.10 is disclosed, since the rule lists
  say nothing about it.

**Non-Goals:**

- **No rule-list change.** Nothing in 2.5.10 justifies one, and a pass that
  advances the target while also moving rules would be a `minor` with two
  unrelated stories in it.
- **No relaxation review.** Whether `react-balanced` is well calibrated is an
  open question recorded elsewhere; it is not this pass's business.
- **No ledger change.** No rule's classification moved.

## Decisions

### 1. Regenerate the snapshot rather than hand-editing its version field

The metadata is provably identical, so editing `"biomeVersion"` by hand would
produce a byte-identical result in a fraction of the time.

*Do it the slow way anyway.* The snapshot is a generated artifact, and the value
of a generated artifact is that its contents are evidence rather than assertion.
Hand-editing the version would make the file *claim* to describe 2.5.10 while
having been produced from 2.5.9 — true today only because someone checked, and
unfalsifiable afterwards. Running the sweep makes the claim self-verifying, and
`check:rule-metadata` will re-derive it on every future run once the versions
agree.

*This is also the pass that proves the empty diff.* "The regenerated file differs
in one line" is a result worth having in the PR, and the only way to have it is
to regenerate.

### 2. The sweep runs against the installed binary, with no `--biome` override

After the `$schema` URLs advance, the pinned target and the installed binary both
read 2.5.10, so `pnpm sync-rule-metadata` works with no arguments. **Order
matters**: run it *after* the `$schema` edit, not before, or the script refuses —
it compares the target it reads from `dist/biome.recommended.json` against the
binary and stops when they disagree.

That refusal is the designed behaviour, not an obstacle to work around. A pass
that regenerated first would be sweeping a version the presets do not yet claim.

### 3. `patch`, and the changeset leads with what is inherited

The rule lists do not move, which the standing requirement pins as the `patch`
case. But a patch whose changeset says only "target 2.5.10" would be
uninformative: the substance of this release for consumers is sixteen Astro
parser fixes, a Vue unused-binding fix that reaches every preset through the
recommended rules, and an LSP memory leak fix.

The changeset therefore separates *what the presets changed* (a version pin) from
*what upgrading Biome hands you* (everything else), the way the 1.15.1 entry
established for releases that inherit behaviour they did not author.

### 4. The unreproduced HTML fix is recorded as unreproduced

The release notes say `{#if x}` in an HTML file is no longer a parse error. A
fixture with `{#if x}a{:else}b{/if}` and `{@html raw}` under `react-strict` is
clean on **both** 2.5.9 and 2.5.10, so the fix did not reach a plain `.html` file
in the shape tested — it may only manifest in `.vue` or Angular templates.

*Record it as unverified rather than dropping it or repeating the release note as
fact.* This repo's convention is that gating and reach are established
empirically; a claim that failed to reproduce is a result, and silently omitting
it would leave the next pass to re-test the same thing.

## Risks / Trade-offs

- **The empty audit invites the conclusion that the pass was skipped** →
  Mitigation: the proposal records the schema hash and the sweep's zero-difference
  result, and the spec now carries a scenario saying an empty diff *is* the
  recorded outcome.
- **Regenerating the snapshot re-arms `check:rule-metadata`**, so the next
  Dependabot bump of `@biomejs/biome` will make it skip again → Accepted and
  intended: that alternation is the designed signal that a pass is owed.
- **Astro users get behaviour changes from a `patch`** → Mitigation: disclosed in
  the changeset. The alternative — calling it a `minor` — would misreport the
  presets as having changed, which is the thing the sizing requirement exists to
  keep honest.
- **Fifteen edits, any one of which could be missed** → Mitigation: this is
  exactly what the pinned-target invariant checks, and it fails naming the files
  that disagree.

## Migration Plan

1. Advance the `$schema` URL in the six `dist/*.json` presets and `biome.json`.
2. Update the seven README references.
3. Run `pnpm sync-stable` — expect the `-stable` files to change only in that line.
4. Run `pnpm sync-rule-metadata` — expect a one-line diff.
5. Run `pnpm run check`; `check:rule-metadata` should now verify rather than skip.
6. Add the `patch` changeset.

Rollback is reverting the version strings; nothing structural changes.
