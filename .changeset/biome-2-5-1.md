---
"@dvashim/biome-config": minor
---

Upgrade presets to Biome 2.5.1 and expand opt-in rule coverage. Requires Biome 2.5.1 or newer.

- Bump the dist `$schema` to 2.5.1. Relocate the 32 rules that graduated out of `nursery` into their stable categories (severity preserved per preset), rename `noMultiStr`→`noMultilineString`, `useFind`→`useArrayFind`, `useSpread`→`useSpreadOverApply`, and drop the removed `noFloatingClasses`.
- Add 41 in-scope opt-in rules to `react-strict` and `react-balanced` at `warn`, including Next.js and React Native domain rules — e.g. `useExhaustiveDependencies`, `useHookAtTopLevel`, `useJsxKeyInIterable`, `noDangerouslySetInnerHtml`, `noImgElement`, `noReactNativeRawText`. `react-balanced` disables `noImgElement` (it fires on any `<img>`).
- Drop `noDuplicateEnumValues` and `noProto`: they graduated into recommended-stable slots and are now active via `recommended: true`.
- The added `noRestricted*` rules are inert until you supply options.

Each preset now enumerates 253 rules; the `-stable` variants are regenerated without nursery.
