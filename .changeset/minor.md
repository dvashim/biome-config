---
"@dvashim/biome-config": patch
---

Improve README documentation and clean up base config

- **Docs:** Restructure README badges using reference-style links for cleaner diffs; add CI status badge (pointing to `check.yml` workflow) and MIT license badge; reorder badges to follow convention (CI, version, downloads, license, tooling)
- **Docs:** Add `files.includes` details to each React config example comment; add FAQ section covering config selection, rule overrides, file exclusions, TypeScript support, and monorepo usage
- **Refactor:** Remove redundant `files.includes: ["**"]` from base recommended config (`dist/biome.recommended.jsonc`) and root `biome.json` — Biome processes all supported files by default when no `includes` is set
