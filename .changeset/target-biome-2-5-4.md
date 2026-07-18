---
"@dvashim/biome-config": patch
---

Update the presets to target Biome 2.5.4: bump the `$schema` URL in all six dist configs (and `biome.json`) and the documented version in the README (2.5.3 → 2.5.4). No rule changes — 2.5.4 is a bug-fix/formatter patch that adds no new lint rules and renames, graduates, or removes none. Its rule-adjacent fixes touch rules the presets already cover (`noLabelWithoutControl`, `noCommentText`) or enhance an already-enabled one (`useSortedClasses`), so the strict/balanced rule lists and the `-stable` variants are unchanged.
