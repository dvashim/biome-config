## Context

See `proposal.md` — Why. The relevant current state is the shape of
`scripts/check-presets.ts` section 6, which reads the README through four prose
matchers:

```
  reads                                         does not read
  +---------------------------------------+     +--------------------------+
  |  - **<cat>** (N rules)      x8         |     |  | table | count cells | |
  |  `noFoo` / `useBar`         all        |     |  "up to N ... rules"     |
  |  -- N rules [across M categories]      |     |                          |
  |  **N targeted relaxations** + 3 more   |     |                          |
  +---------------------------------------+     +--------------------------+
       per-CATEGORY granularity                       preset TOTALS
```

Two of the four already fail when they match nothing — the per-category loop runs
in both directions, and `checkPhrase` pushes `README has no <what> to check` on a
miss. That existing behaviour is what makes prose matchers safe to add, and this
design generalises it rather than inventing it.

The Configurations table is a stable markdown table with a header row
(`Preset | \`extends\` path | Explicit rules | Nursery`) and one row per preset,
each row already naming its preset unambiguously via the `extends` path.

## Goals / Non-Goals

**Goals:**

- Close the *class*: no published preset total can drift unnoticed, whatever
  sentence or cell it sits in.
- Keep the README's current structure. The check adapts to the document, not the
  other way round.
- Keep section 6 offline and snapshot-only, like the other seven invariants.

**Non-Goals:**

- Restructuring the README, or removing the redundancy between the table and the
  per-category bullets. The duplication is useful to readers; it just has to be
  verified.
- Enforcing anything in `CLAUDE.md`. That file is internal and its prose is
  freeform — see Decision 3.
- Generating any part of the README. A generator is the right answer if the
  published numbers grow past a handful of stable sites; today they do not.

## Decisions

### 1. Parse the Configurations table structurally, not by regex

Read the table by locating its header row, mapping the `Explicit rules` and
`Nursery` column indices by name, and identifying each row's preset from the
`extends` path in its cells. Compare against the presets loaded from `dist/`.

*Why:* the two sites that went stale (`| 264 | 82 |`, `| 182 | -- |`) are bare
numeric cells with no surrounding words. Any text-proximity matcher misses them —
see Decision 2. Column-name lookup also survives a column being reordered or a
preset row being added, which a positional or regex read would not.

*Alternative — one regex per table row:* rejected. Six near-identical regexes is
the whack-a-mole this change exists to end, and they break on any row edit.

### 2. Reject the shape-independent count harvest

The tempting general answer — harvest every integer sitting near the words
`rule`/`rules`/`entries` and require each to be a known-true count — was
prototyped against the current `README.md` and `CLAUDE.md` before this design was
written. It performs badly in both directions:

```
  MISSES   L77  | React strict     | ... | 264 | 82 |    no counting word on
  MISSES   L78  | React strict-st. | ... | 182 | -- |    the line at all
  FALSE +  15 hits: "Biome 2.5.0" -> 2, 5, 0 | "7 categories"
             "11 Playwright rules" | "522 rules" | "16 GraphQL rules"
             "201 correct rules" | "flag 201 correct rules"
```

It misses precisely the two sites that caused the defect, and would need a
suppression list for the fifteen it invents — a second ledger to maintain, for a
check that still would not catch the bug. Structure beats proximity here because
the document genuinely has structure.

### 3. Enforce the README; de-duplicate `CLAUDE.md`

`README.md` is published (npm serves it from the tarball regardless of
`files: ["dist"]`), its counts are load-bearing for consumers choosing a preset,
and they live in stable shapes. Enforce them.

`CLAUDE.md`'s three counts are internal duplication in freeform prose. Enforcing
them means three more bespoke matchers against sentences nobody has a reason to
keep stable — reintroducing the fragility Decision 1 avoids. Remove the numbers
and point at the README table instead.

The resulting rule has no exceptions to remember: **a preset total is published in
exactly one document, and that document is checked.**

*Alternative — enforce both:* rejected on fragility. *Alternative — leave
`CLAUDE.md` stale:* rejected; it is the briefing document for the agent running
the next version-tracking pass, and a stale brief propagates.

### 4. Every count matcher is mandatory

A matcher that finds nothing fails, reporting that it has no count to check.
Without this, Decision 1's structural read degrades silently the day someone
retitles a column, and a prose matcher degrades silently the day someone rewords
a sentence — reproducing the original defect one level up.

## Risks / Trade-offs

- **The check now depends on README structure, so an innocent doc edit can redden
  CI.** → That is the intended trade (Decision 4), and the failure is loud and
  self-describing rather than silent. The messages name the column or phrase that
  went missing.
- **Column-name lookup breaks if the table is retitled.** → Fails loudly per
  Decision 4; the fix is a one-line constant. Preferable to a positional read that
  would silently compare the wrong column.
- **`patch` is a judgment call for a README-only release.** → Now written into the
  spec rather than re-derived per change, so the next one does not have to
  re-litigate it.
- **This does not prevent a *seventh* shape appearing in some future document.**
  → Partly mitigated by Decision 3 keeping totals to one document. If published
  counts spread again, the answer is a generated region, not a ninth matcher.

## Migration Plan

Land the check and the corrections together — the check fails against the current
README by construction, so they cannot be separated. Sequencing against the
pending Biome 2.5.11 pass matters:

```
  1. this change      check enforces totals; README 264/182 -> 262/180
        |
        v             check:presets now RED on any stale total
  2. Biome 2.5.11     adds noUndeclaredCustomProperties (CSS, in scope);
                      noAstroSetHtmlDirective is Astro-only, excluded.
                      262 -> 263, 180 -> 181. Cannot land until every
                      published total moves.
```

Landing this change second would mean the 2.5.11 pass carries a defect its own
checklist cannot see — which is how the current staleness arrived.

Rollback is reverting the commit; nothing in `dist/` moves, so no consumer config
changes and `sync-stable` and the rule-metadata snapshot are untouched.

## Open Questions

None blocking. One deferrable: whether the per-category bullets should eventually
be generated from the presets rather than checked against them. That would remove
a whole class of manual reconciliation, but it changes how the README is authored
and is worth its own change if the count sites keep multiplying.
