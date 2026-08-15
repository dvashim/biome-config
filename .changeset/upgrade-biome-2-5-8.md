---
"@dvashim/biome-config": minor
---

Bump Biome from 2.5.7 to 2.5.8. Update the `$schema` URL across all six dist configs, `biome.json`, and the README. Add two new nursery rules to `react-strict` and `react-balanced`:

- `noInvalidPropertyInitValue` (`warn` in both) — checks that a CSS `@property` rule's `initial-value` matches the format its `syntax` declares. Browsers silently refuse to register a custom property whose `initial-value` does not match, so this catches an otherwise invisible failure.
- `useReactCompiler` (`warn` in strict, `off` in balanced) — runs React Compiler in lint mode and reports components and hooks it cannot safely compile. Balanced turns it off: the rule reports code that is correct today, flagging only its incompatibility with an architecture most projects have not adopted, so it fires broadly on codebases that are not migrating.

Biome 2.5.8 also adds `noSvelteLegacyConst`, which is deliberately omitted — its only domain is `svelte`, and the presets exclude rules exclusive to non-React frameworks. These are the only rules 2.5.8 adds; none were renamed, graduated out of nursery, or removed, and the release introduces no new formatter, assist, or `files` options, and no new option on any rule the presets already list.

Two upstream behavior changes come with Biome 2.5.8 itself and are inherited rather than suppressed, so expect them when you upgrade even though no preset rule caused them:

- **HTML `style` attribute values are now parsed as CSS**, and every CSS lint rule applies inside them. These presets enable CSS rules and turn on full HTML support, so projects with HTML files may see new diagnostics inside `style="..."`.
- **`useSortedClasses` orders variants under `sort_v4`.** It is an assist, so `biome check --write` can reorder Tailwind classes differently than on 2.5.7 — a one-time diff.

Three fixes make existing rules report less, and need nothing from you: `useAwait` no longer reports async functions containing an `await using`; `noUselessUndefined` no longer reports `return undefined` when the function has a non-`undefined` return type annotation; `noUndeclaredVariables` no longer reports Vue template globals.

One behavior note specific to `useReactCompiler`: unlike every other framework rule these presets enable by name, it re-checks for its gating dependency at runtime. With `react` absent from your `package.json` it reports nothing and costs nothing, so `react-strict` consumers who do not use React are unaffected by it. On React sources it added roughly 16% to lint time on a 60-file benchmark.
