---
"@dvashim/biome-config": patch
---

Document what a release inherits from Biome, and pin the README's remaining `$schema` examples

- **Versioning:** Record that either release size can carry changes that come from Biome rather than from the presets. A release that advances the Biome version the presets target hands every preset that version's formatter output, parser coverage, and rule fixes — including `recommended`, `react-recommended`, and the `-stable` variants, whose rule lists did not move. 1.15.0 is the worked example: it changed HTML formatting for all six presets.
- **Docs:** Pin the two FAQ `biome.json` snippets to `https://biomejs.dev/schemas/2.5.9/schema.json` rather than `schemas/latest`, matching the Usage example and the Requirements section's advice to use the version the presets target.
- **Presets:** No preset changes — no `dist/*.json` file is touched, so no diagnostics change.
