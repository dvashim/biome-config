## Why

The README inventory invariant is written — in the spec and in
`scripts/check-presets.ts` — at **per-category** granularity. A preset's **total**
rule count is never mentioned by either. The README publishes that total in five
places and `CLAUDE.md` in three, and none of the eight is checked.

All five mutable README sites are stale. `enforce-preset-scope` moved the presets
from 264 to 262 listed rules and 182 to 180 in the `-stable` variants; it updated
exactly the sites `check:presets` reads and left the rest. `README.md` ships in
the npm tarball regardless of `files: ["dist"]`, so the package page currently
advertises rule counts that no preset has.

This is the second defect of the same shape. Coverage accepted "listed in
`react-strict`" as an answer, so two GraphQL rules satisfied it by being listed;
the README invariant accepts "the per-category bullets add up" as an answer, so
the totals drift underneath. Both times a check walked one direction and was read
as if it walked both.

## What Changes

- Extend the **README inventory** invariant from per-category counts to **every
  published preset total**: the Configurations table's `Explicit rules` and
  `Nursery` columns, and the introductory ladder bullet.
- Parse the Configurations table **structurally** — by header column, with each
  row identified by the `extends` path it already carries — rather than by prose
  regex. Require one row per published preset, so a seventh preset cannot enter
  undocumented.
- Make every prose matcher in the README inventory check **mandatory**: a matcher
  that finds nothing fails, so rewording a sentence cannot silently retire its
  check. (`check-presets.ts` already does this for per-category counts and the
  relaxation phrases; the new matchers adopt the same rule.)
- Correct the five stale README numbers (264 -> 262 in three places, 182 -> 180 in
  two) and **remove** the three counts from `CLAUDE.md`, replacing them with a
  pointer to the README table. Internal freeform prose is not worth a regex; the
  fix for duplication there is to stop duplicating.
- Name the changeset size for a release that edits `README.md` without changing a
  preset rule list or advancing the `$schema` target — a case the current sizing
  requirement does not cover, and which this change is itself an instance of.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `linter-rule-coverage`: three requirements change.
  - **README rule inventory matches the presets** — extends from per-category
    counts and rule names to include every published preset total, and requires
    the Configurations table to carry a row per preset.
  - **Mechanically decidable preset invariants are enforced by the build** — the
    enumerated **README inventory** invariant is restated to include preset
    totals and table-row coverage, and to require that a prose matcher which
    matches nothing is a failure.
  - **Version-tracking passes release according to their published impact** —
    gains the documentation-only case: a `README.md` edit with no rule-list
    change and no `$schema` advance ships as a `patch`.

## Impact

- `scripts/check-presets.ts` — section 6 (README inventory) gains structural
  table parsing and total-count comparison. No other section moves.
- `README.md` — five stale counts corrected. No prose restructuring; the table
  keeps its current columns, which the check now reads as its source.
- `CLAUDE.md` — three counts removed in favour of a pointer to the README table.
- `openspec/specs/linter-rule-coverage/spec.md` — three modified requirements.
- Release: **patch**. The published surface changes (README counts) but no preset
  rule list moves and the `$schema` target does not advance.
- No change to `dist/*.json`, so `sync-stable` and the rule-metadata snapshot are
  untouched.
