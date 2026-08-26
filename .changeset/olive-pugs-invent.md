---
"@dvashim/biome-config": patch
---

Target Biome 2.5.10

- **Target:** Advance the `$schema` URL to 2.5.10 across all six dist configs, `biome.json`, and the README. The `@biomejs/biome` requirement moves to `^2.5.10`.
- **No rule changes.** 2.5.10 adds no lint rule and renames, graduates, or removes none, and adds no option to any rule these presets list — its configuration schema is byte-identical to 2.5.9's. Every preset lists exactly the rules it listed before, so no diagnostic changes because of this release.
- **Inherited from Biome — Astro.** Sixteen parser fixes, the bulk of the release: an expression containing only a comment no longer fails to parse (which previously stopped the whole file from being formatted), a bare `<` in text is text, `{}` renders as nothing, fragment shorthand is supported, frontmatter is no longer cut short by `</script>` inside a string or by a line beginning with a dash, `is:raw` children are treated as raw text, colon-prefixed attributes such as `:href` parse, `{` inside `<math>` stays literal, `{{` opens an object literal rather than an interpolation, `<pre>` and `<textarea>` contents are parsed as markup, template-literal attribute values work, and HTML5 unquoted attribute values containing `` ` ``, `=`, `'` or `"` are accepted. These presets omit Astro-specific *rules* by design, but they lint every file Biome can parse — so if your project has `.astro` files, this release changes how they are parsed and formatted.
- **Inherited from Biome — Vue.** Variables and imports used only by same-name bindings such as `:disabled` or `v-bind:disabled` are no longer reported as unused. That is `noUnusedVariables` and `noUnusedImports`, which are recommended and therefore active in **every** preset here, including `recommended` and both `-stable` variants. Separately, `useStrictMode` no longer reports Vue event handlers such as `@click="count++"`.
- **Inherited from Biome — Svelte.** Biome no longer crashes on incomplete `{let}` or `{const}` declarations.
- **Inherited from Biome — performance.** `noFloatingPromises` skips needless type inference on call arguments of methods on non-generic `new` instances, and eight test-quality rules got faster: `useNamedCaptureGroup`, `noMisplacedAssertion`, `noSkippedTests`, `noExportsInTest`, `noDuplicateTestHooks`, `noIdenticalTestTitle`, `useTestHooksInOrder`, and `useTestHooksOnTop`. No diagnostics change.
- **Inherited from Biome — editors.** A memory leak in the LSP server, where usage grew over long editing sessions, is fixed.
