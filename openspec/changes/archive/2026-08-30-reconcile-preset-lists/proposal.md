## Why

`scripts/check-presets.ts` keeps two hand-maintained answers to "which presets
exist": the `SCHEMA_PINNED` constant, and `package.json`'s `exports` map. Nothing
reconciles them. The README-inventory check added by `enforce-readme-totals`
iterates the second and indexes into a map built from the first, through an
`as Preset` cast that tells TypeScript to stop caring whether the lookup hit.

When the two disagree, the check does not report a problem — it dies:

```
TypeError: Cannot read properties of undefined (reading 'linter')
    at entriesOf (scripts/check-presets.ts:125:57)
    at scripts/check-presets.ts:479:23
```

Reproduced by exporting a seventh preset and giving it a README row. Nine of the
ten `as Preset` casts in the file iterate the same list that built the map and
are sound; the tenth, added in `bc75cd5`, does not and is not.

This is the third instance of one pattern. Coverage walked the release but not
the presets, so two GraphQL rules satisfied it by being listed. The README
invariant walked categories but not totals, so five published counts drifted.
Now two lists of presets are each other's unverified assumption.

## What Changes

- **Derive the pinned-file list instead of maintaining it.** `SCHEMA_PINNED`
  becomes the `dist/*.json` targets of `package.json`'s `exports` map plus the
  root `biome.json`. With one source of truth the two lists cannot disagree, so
  the class is removed rather than checked — the same move `enforce-readme-totals`
  made for `CLAUDE.md`'s duplicated counts.
- **Replace the unsound cast with real handling**, so a lookup that misses
  reports a named problem instead of throwing. Derivation makes a miss
  unreachable through this path; the handling is what stops a *future* caller
  reintroducing the crash.
- **Guard the four named preset constants** (`STRICT`, `BALANCED`,
  `STRICT_STABLE`, `BALANCED_STABLE`) against the derived set. Those paths stay
  hand-written because the parity and relaxation logic needs them by name, so
  they remain able to go stale if a preset is ever renamed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`: one requirement changes.
  - **Mechanically decidable preset invariants are enforced by the build** — the
    set of files the checks cover SHALL be derived from the package's own export
    map rather than maintained beside it, and a preset the checks cannot resolve
    SHALL be reported as a named failure rather than aborting the run.

## Impact

- `scripts/check-presets.ts` — `SCHEMA_PINNED` derived, one cast removed, one
  guard added. No invariant's logic changes; the same eight run over the same
  seven files.
- `openspec/specs/linter-rule-coverage/spec.md` — one modified requirement.
- No changeset. Nothing in `dist/*.json` or `README.md` moves, which the
  release-sizing requirement names as the no-changeset case.
