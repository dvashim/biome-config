## Context

See `proposal.md` — Why. The mechanics that matter:

```
  package.json exports ---> publishedPresets  (derived, 6 dist files)
                                   |
                                   |  the README row loop iterates THIS
                                   v
                          presets.get(path) as Preset
                                   ^
                                   |
  SCHEMA_PINNED (hand-written) ---> presets map  (6 dist files + biome.json)

        the two agree today. nothing makes them agree.
```

The cast audit is what localises the defect:

```
  10  `as Preset` casts in scripts/check-presets.ts
   9  iterate SCHEMA_PINNED, RULE_PRESETS, or a named constant
        -> the map was built from that same list. sound.
   1  iterates publishedPresets, derived from package.json
        -> line 479. unsound.
```

`Map.get` returns `T | undefined`. `as Preset` suppresses that, so the nine
correct uses and the one incorrect use are indistinguishable to the reader and to
`tsc`. The idiom was locally safe everywhere it already appeared, which is why it
was reached for again in the one place its precondition does not hold.

## Goals / Non-Goals

**Goals:**

- Make "which presets exist" have exactly one answer in the repo.
- Make an unresolvable preset a reported problem, so `check:presets` cannot exit
  on a stack trace while holding unreported findings.
- Leave every invariant's logic untouched — this change moves where a list comes
  from, not what is checked.

**Non-Goals:**

- Reading `dist/` from the filesystem as a third source of truth. `publint`
  already verifies every export resolves to a file that exists; the remaining gap
  is a `dist/*.json` that is neither exported nor referenced, which is inert —
  consumers cannot reach it and no check depends on it.
- Deriving `RULE_PRESETS`. It could be computed as "presets whose entry list is
  non-empty", but that would make a preset silently drop out of the parity and
  redundancy checks if its rules were ever emptied by accident. An explicit list
  fails loudly instead.
- Removing the `as Preset` idiom from the nine sound call sites. They are correct,
  and rewriting them is churn that would bury the one line that matters.

## Decisions

### 1. Derive `SCHEMA_PINNED`, don't reconcile it

`SCHEMA_PINNED` becomes the `dist/*.json` targets of `package.json`'s `exports`
map, deduplicated, plus the root `biome.json`.

*Why derive over reconcile:* a reconciliation check would report the disagreement,
which is better than crashing but still leaves two lists to keep in step. Deriving
removes the second list, so the disagreement has nowhere to occur. This is the
same call `enforce-readme-totals` made for `CLAUDE.md` — enforce a duplicated
number where the shape is stable, delete the duplicate where it is cheaper — and
here deleting is strictly cheaper.

*Why `biome.json` stays hand-named:* it is the repo's own root config, not a
published preset, so no export map mentions it. It is one constant with no
counterpart that could drift.

### 2. Keep the four named constants, and check them

`STRICT`, `BALANCED`, `STRICT_STABLE` and `BALANCED_STABLE` stay written out.
Parity, relaxation counting and the `-stable` totals all refer to specific presets
by name; there is no derivation that distinguishes "the strict one" from "the
balanced one".

That leaves four hand-written paths that could go stale if a preset were renamed,
so each is verified against the derived set. Without that, a rename would make
`presets.get(STRICT)` miss and reintroduce exactly the failure this change
removes — one layer further in.

### 3. Handle the miss even though derivation makes it unreachable

With `SCHEMA_PINNED` derived from the same map the row loop walks, the lookup at
line 479 cannot miss. The `as Preset` cast is still replaced with a real
`undefined` branch.

*Why keep the branch when it is dead:* it is not dead against future edits. The
cast's failure mode is that it looks correct in review — it read as correct in
`bc75cd5` — and the next caller to index this map from a different list gets a
stack trace instead of a message. Deriving fixes today's instance; the branch is
what makes tomorrow's a reported problem.

## Risks / Trade-offs

- **A malformed `exports` map now breaks every invariant, not just packaging.**
  → `publint --strict` runs in the same `pnpm run check` fan-out and reports the
  packaging fault directly, so the two failures arrive together and the cause is
  named by one of them.
- **Deriving hides the file list from a reader skimming the constants.** → The
  derivation is three lines next to where the constant used to be, and it names
  its source. A reader who wants the list can read `package.json`, which is where
  the answer actually lives.
- **The four named constants remain a manual coupling.** → Now checked (Decision
  2), so a rename fails loudly rather than crashing or silently checking nothing.

## Migration Plan

Single commit on the current branch. `bc75cd5` is unpushed, so the crash could
instead be amended into it — deliberately not doing that: the change adds a
requirement to the spec, and folding a spec-level addition into an archived
change's commit would misreport when the invariant was introduced. A defect fixed
in the open is better history than a defect that never appears.

Rollback is reverting the commit; nothing in `dist/` or `README.md` moves.
