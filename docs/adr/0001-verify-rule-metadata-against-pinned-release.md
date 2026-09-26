# 0001. Verify the rule metadata against the pinned Biome release, not the installed one

Status: accepted
Date: 2026-09-26
Supersedes: none

## Context

The presets' coverage verdict ("0 unaccounted") is computed from
`audit/rule-metadata.json`, a generated snapshot of every rule the pinned Biome
release declares. The success signal of `docs/intents/0001-keep-presets-current.md`
asks whether an update that moves the package to a new release carries that
release's related rules. That answer is only as true as the snapshot.

Until now the snapshot could be verified only against the installed binary, and
the check skipped whenever the installed version and the pinned target differed.
The skip followed from two standing decisions, both of which remain in force:

- the snapshot describes the release the presets target, not the installed binary;
- the split state that an automated Biome bump creates is the trigger for a
  version-tracking pass, not a defect, so it must not fail CI.

The skip left the snapshot unverified in exactly the state where it could be
stale. Every pinned file and the snapshot's version were relabelled to a release
that was never swept, and every check still passed (see the Context section of
`design.md` in the `close-coverage-gaps` change).

A binary of any published release can be fetched on demand. A full sweep through
`pnpm dlx @biomejs/biome@<version>` took 24 s, against 11 s with the installed
binary.

Change: `close-coverage-gaps`, under `openspec/changes/`, then `archive/` once
it is archived.

## Decision

A binary of the Biome release the presets pin is always the one that reads,
verifies and serializes the rule-metadata snapshot:

- The installed binary is used when it is that release. Otherwise the release is
  fetched for the run.
- When the pinned release cannot be obtained, the check fails. It never skips,
  and it never compares against another version's rules or writes them.
- An explicit binary override is honoured only when it reports the pinned
  version.

## Consequences

- **Easier.** The coverage verdict can be trusted in every state. That includes
  the split state after an automated bump, and a pass that deliberately targets an
  intermediate release below the installed binary. Regeneration no longer needs a
  manual override when the versions differ.
- **Harder.** While the installed binary and the pinned target differ,
  `pnpm run check` needs network access to the npm registry and biomejs.dev, takes
  about 13 s longer, and fails offline, locally and in CI alike.
- **Future changes must:**
  - rely on this verification in any new check that reads the snapshot, rather
    than re-deriving the snapshot or trusting it unverified;
  - supersede this ADR to make the check suite hermetic or offline-capable, rather
    than bring back a silent skip;
  - keep serializing with the swept binary, so the byte-exact comparison never
    reports formatter differences between Biome versions as drift.
