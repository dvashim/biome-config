---
"@dvashim/biome-config": patch
---

Correct the README's published rule counts

- **Documentation only.** No preset changed. `react-strict` and `react-balanced` list the same 262 rules they have listed since the two out-of-scope GraphQL rules were removed, and both `-stable` variants list the same 180. Nothing about the diagnostics you receive changes.
- **What was wrong.** The README advertised 264 explicit rules and 182 in the `-stable` variants — the counts from before that removal. Five sites were stale: the ladder bullet in the intro and all four count cells in the Configurations table. The per-category counts and the prose totals further down were already correct, which is exactly why the discrepancy survived: the build checked those and not these.
- **Why it could not be caught.** `check:presets` read the README through matchers shaped around per-category bullets and em-dash prose. A preset's *total* was never part of the invariant, in the check or in the standing requirement behind it, so the Configurations table's bare numeric cells had nothing looking at them.
- **Fixed for good.** The Configurations table is now parsed structurally — count columns located by header name, each row keyed by the `extends` path it already publishes — and reconciled against the presets, along with the intro bullet. The table must also carry one row per published preset, so a new preset cannot ship undocumented. Every matcher fails when it finds nothing, so rewording the text around a count reports a missing check rather than passing silently.
