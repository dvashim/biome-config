---
"@dvashim/biome-config": minor
---

Bump Biome from 2.4.12 to 2.4.13. Update `$schema` URLs across all configs, `biome.json`, and README. Add six new nursery rules to `react-strict` and `react-balanced` configs:

- `noJsxLeakedDollar` — flag text nodes with a trailing `$` before a JSX expression (e.g. `<div>Hello ${user.name}</div>`), a common leftover when a template literal is converted to JSX.
- `noLoopFunc` — warn when a function declared inside a loop captures outer variables that can change across iterations (classic closure-over-loop-variable bug).
- `noUnnecessaryTemplateExpression` — flag template literals whose contents are only string literal expressions (e.g. `` `${"hello"}` `` → `"hello"`, `` `${"a"}${"b"}` `` → `"ab"`).
- `useDomNodeTextContent` — prefer `textContent` over `innerText` for DOM node access; `textContent` is cheaper and does not trigger layout reflow.
- `useDomQuerySelector` — prefer `querySelector()` / `querySelectorAll()` over `getElementById()`, `getElementsByClassName()`, and similar legacy DOM methods for a single consistent query API.
- `useRegexpTest` — enforce `RegExp.prototype.test()` over `String.prototype.match()` / `RegExp.prototype.exec()` in boolean contexts; `test()` returns a boolean directly and avoids allocating a match-result array.

Four React Native-only rules from 2.4.13 (`noReactNativeDeepImports`, `noReactNativeLiteralColors`, `noReactNativeRawText`, `useReactNativePlatformComponents`) are intentionally omitted — this package targets React for the web.
