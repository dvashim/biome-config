---
"@dvashim/biome-config": patch
---

Update the presets to target Biome 2.5.3: bump the `$schema` URL in all six dist configs (2.5.1 → 2.5.3) and the documented version requirement in the README. No rule changes — 2.5.2 and 2.5.3 are bug-fix releases; the only new rule (`noSvelteUnnecessaryStateWrap`, nursery) is Svelte-specific and out of scope for these presets.
