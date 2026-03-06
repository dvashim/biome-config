---
"@dvashim/biome-config": patch
---

Update Biome version to 2.4.6

- Update `@biomejs/biome` dependency and schema URLs to 2.4.6
- **CI:** Fix dangerous `cancel-in-progress` on release workflow, add explicit permissions, gate release on checks, add npm provenance
- **CI:** Add `.node-version` file and use `node-version-file` in workflows
- **Config:** Fix changeset access mismatch (`restricted` → `public`)