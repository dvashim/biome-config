---
"@dvashim/biome-config": minor
---

Bump Biome from 2.5.5 to 2.5.6. Update the `$schema` URL across all six dist configs, `biome.json`, and the README. Add one new nursery rule to `react-strict` and `react-balanced`:

- `noJsRestrictedProperties` — bans access to specific object/property pairs, and reports them in object destructuring too. It requires explicit configuration and emits nothing until you supply its `entries`, so it ships at `warn` with no options, matching the existing `noRestrictedGlobals` / `noRestrictedImports` / `noRestrictedTypes` family. Configure it to ban project-specific property access, e.g. `require.ensure` or `__defineGetter__`.

It is the only rule Biome 2.5.6 adds — none were renamed, graduated out of nursery, or removed — and the release introduces no new formatter, assist, or `files` options. `react-strict` and `react-balanced` now enumerate 255 rules each; the `-stable` variants are unchanged apart from the `$schema` bump, since nursery rules are stripped from them.
