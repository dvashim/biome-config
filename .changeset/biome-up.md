---
"@dvashim/biome-config": minor
---

Upgrade Biome to 2.4.9 and add new nursery rules

- **Dependencies:** Upgrade `@biomejs/biome` from 2.4.8 to 2.4.9 and `validate-package-exports` from 0.22.0 to 0.23.0
- **Rules:** Add 3 new nursery rules to strict and balanced configs:
  - `noDuplicateSelectors` (warn) — prevent duplicate CSS selectors
  - `noInlineStyles` (warn) — discourage inline styles in JSX
  - `noUntrustedLicenses` (warn) — flag dependencies with untrusted licenses
- **Config:** Update `biome.json` to expand `files.includes` from `["**/dist"]` to `["**"]` so Biome processes all project files, and add an override to disable `useSortedKeys` for `package.json` (which uses conventional, non-alphabetical key order)
- **Schema:** Update `$schema` URL to 2.4.9 across all four dist config files, `biome.json`, and `README.md`
