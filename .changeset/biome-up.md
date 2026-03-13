---
"@dvashim/biome-config": patch
---

Update Biome to v2.4.7 and add new nursery linter rules

- **Deps:** Update `@biomejs/biome` to v2.4.7 and `validate-package-exports` to v0.21.0
- **Rules:** Add `noEmptyObjectKeys`, `noTopLevelLiterals`, `useBaseline`, and `useImportsFirst` nursery rules to strict and balanced configs
- **Tooling:** Add `/add-rule` slash command for inserting Biome linter rules into dist config files
