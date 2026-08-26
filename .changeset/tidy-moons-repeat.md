---
"@dvashim/biome-config": minor
---

Remove two GraphQL-only rules the React presets should never have listed

- **Rule:** Remove `useDeprecatedDate` from `react-strict`, `react-balanced`, and both `-stable` variants. It requires a deletion date on GraphQL's `@deprecated` directive, and it is not one of Biome's recommended rules — so removing the entry **switches it off**. If you lint `.graphql` files and want it, enable it yourself.
- **Rule:** Remove `noDuplicateEnumValueNames` from the same four presets. It requires unique enum value names in a GraphQL schema — not TypeScript enums. It **is** recommended, so removing the entry does not disable it: it reverts to Biome's default and stays active at **`error`** where these presets were publishing `warn`. If you lint `.graphql` files, expect that diagnostic to get louder, not quieter. The presets never decided to soften it — `warn` was simply the severity every added rule receives — so this restores the upstream default rather than changing a considered position.
- **Scope:** Both rules target GraphQL exclusively, which these presets exclude by design and the README has always said they exclude. Both entered by accident: `useDeprecatedDate` in the bulk pass that added 41 opt-in rules for Biome 2.5.1, and `noDuplicateEnumValueNames` before the config files were renamed to `.json`.
- **Presets:** `react-strict` and `react-balanced` now enumerate **262** rules (was 264); `react-strict-stable` and `react-balanced-stable` now enumerate **180** (was 182). `recommended` and `react-recommended` are unchanged.
- **No Biome change:** the presets still target Biome 2.5.9 and no `$schema` moves. If you do not lint GraphQL, this release changes nothing for you.
