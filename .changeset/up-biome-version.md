---
"@dvashim/biome-config": minor
---

## Upgrade Biome to v2.4.5 and migrate config files to JSONC

### Biome version

- Upgraded `@biomejs/biome` from `^2.4.4` to `^2.4.5`
- Updated schema URL to `2.4.5` in all config files

### Config format migration

- Renamed all dist config files from `.json` to `.jsonc`
- Added `// MARK:` section comments throughout all config files for navigation
- Updated package exports to reference `.jsonc` files

### New nursery rules (react-strict and react-balanced)

- `useArraySome`
- `useNamedCaptureGroup`
- `useNullishCoalescing`
- `useUnicodeRegex`

### Documentation

- Updated README with revised Defaults and Rules sections
- Added strict-vs-balanced comparison table
