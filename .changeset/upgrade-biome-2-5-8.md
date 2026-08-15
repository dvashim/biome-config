---
"@dvashim/biome-config": minor
---

Target Biome 2.5.8 and add the two new rules that are in scope

- **Target:** Advance the `$schema` URL to 2.5.8 across all six dist configs, `biome.json`, and the README.
- **Rule:** Add `noInvalidPropertyInitValue` (`warn` in strict and balanced) — checks that a CSS `@property` rule's `initial-value` matches the format its `syntax` declares. Browsers silently refuse to register a custom property whose `initial-value` does not match, so this catches an otherwise invisible failure.
- **Rule:** Add `useReactCompiler` (`warn` in strict, `off` in balanced) — runs React Compiler in lint mode and reports components and hooks it cannot safely compile. Balanced turns it off because the rule reports code that is correct today, flagging only its incompatibility with an architecture most projects have not adopted.
- **Omitted:** `noSvelteLegacyConst`, the third rule 2.5.8 adds, is excluded — its only domain is `svelte`, and these presets exclude rules exclusive to non-React frameworks.
- **Scope:** These are the only rules 2.5.8 adds. None were renamed, graduated out of nursery, or removed, and the release adds no formatter, assist, or `files` option, and no option on any rule the presets already list.
- **Stable variants:** Both additions are nursery, so `react-strict-stable` and `react-balanced-stable` are unchanged apart from their `$schema` line.
- **Gating:** Unlike the other framework rules these presets enable by name, `useReactCompiler` re-checks for its dependency at runtime. Without `react` in your `package.json` it reports nothing and costs nothing. On React sources it added roughly 16% to lint time on a 60-file benchmark.
- **Inherited from Biome:** HTML `style` attribute values are now parsed as CSS, and every CSS lint rule applies inside them — projects with HTML files may see new diagnostics inside `style="..."`.
- **Inherited from Biome:** `useSortedClasses` now orders variants under `sort_v4`, so `biome check --write` can reorder Tailwind classes differently than on 2.5.7, producing a one-time diff.
- **Inherited from Biome:** Three fixes make existing rules report less and need nothing from you — `useAwait` no longer reports async functions containing an `await using`, `noUselessUndefined` no longer reports `return undefined` under a non-`undefined` return type annotation, and `noUndeclaredVariables` no longer reports Vue template globals.
