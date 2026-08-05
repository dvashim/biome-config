---
"@dvashim/biome-config": minor
---

Bump Biome from 2.5.6 to 2.5.7. Update the `$schema` URL across all six dist configs, `biome.json`, and the README. Add the three new nursery rules to `react-strict` and `react-balanced`:

- `noExtendNative` (`warn` in both) — reports extending the prototype of a built-in, whether by direct assignment (`Array.prototype.times = …`) or through `Object.defineProperty`, since the added property leaks into every value of that type.
- `noNonScalableViewport` (`warn` in both) — reports `<meta name="viewport" content="…user-scalable=no">`, which blocks zoom and fails WCAG 1.4.4. Biome's own default severity is `error`; the presets list it at `warn` so upgrading cannot turn a passing build red on a rule you never opted into.
- `noTailwindArbitraryValue` (`warn` in `react-strict`, `off` in `react-balanced`) — reports Tailwind arbitrary values such as `w-[400px]`, `text-[#555]`, and `[color:red]` in class attributes, configured utility functions, and tagged templates. Arbitrary values are a deliberate escape hatch in real Tailwind codebases, so balanced ships it off. It is the first balanced relaxation that lives in `nursery`, so unlike the other 15 it does not carry into `react-balanced-stable`.

These are the only rules Biome 2.5.7 adds — none were renamed, graduated out of nursery, or removed — and the release introduces no new formatter, assist, or `files` options. It does add `ignoreIfStatements` to `useNullishCoalescing`, along with new default behavior: Biome now reports `if` statements that only assign to a nullish variable (`if (!a) { a = b }`) as candidates for `??=`. Both presets keep their bare `"warn"` entry and inherit that default, so upgrading Biome can surface new diagnostics there — set `ignoreIfStatements: true` to opt out.

`react-strict` and `react-balanced` now enumerate 258 rules each (76 nursery); the `-stable` variants are unchanged apart from the `$schema` bump, since nursery rules are stripped from them.
