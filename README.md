# Biome Configurations

Shared [Biome](https://biomejs.dev) configuration presets — a base recommended config plus a family of React presets (`recommended`, `strict`, `balanced`, and nursery-free `-stable` variants) that you extend in your own `biome.json`.

[![CI][ci-badge]][ci-url]
[![npm version][version-badge]][npm-url]
[![npm downloads][downloads-badge]][npm-url]
[![license][license-badge]][license-url]
[![Checked with Biome][biome-badge]][biome-url]
[![Socket Badge][socket-badge]][socket-url]

[ci-badge]: https://img.shields.io/github/actions/workflow/status/dvashim/biome-config/check.yml?logo=github&label=CI
[ci-url]: https://github.com/dvashim/biome-config/actions/workflows/check.yml
[version-badge]: https://img.shields.io/npm/v/@dvashim/biome-config.svg?logo=npm&color=07c&label=@dvashim/biome-config
[downloads-badge]: https://img.shields.io/npm/dm/@dvashim/biome-config?logo=npm&color=07c
[npm-url]: https://www.npmjs.com/package/@dvashim/biome-config
[license-badge]: https://img.shields.io/npm/l/@dvashim/biome-config?color=07c
[license-url]: https://github.com/dvashim/biome-config/blob/main/LICENSE
[biome-badge]: https://img.shields.io/badge/Checked_with-Biome-60a5fa?logo=biome&color=07c&logoColor=fff
[biome-url]: https://biomejs.dev
[socket-badge]: https://socket.dev/api/badge/npm/package/@dvashim/biome-config
[socket-url]: https://socket.dev/npm/package/@dvashim/biome-config

## Table of Contents

- [Installation](#installation)
- [Configurations](#configurations)
- [Usage](#usage)
- [Defaults](#defaults)
- [Rules](#rules)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install the presets together with [Biome](https://biomejs.dev) (which is not bundled) as dev dependencies.

npm:

```bash
npm install -D @dvashim/biome-config @biomejs/biome
```

or pnpm:

```bash
pnpm add -D @dvashim/biome-config @biomejs/biome
```

> **Requirements:** Biome **2.5.5+** (the version these presets target) and Node.js **>= 24**.

## Configurations

| Domain | Level | Path |
|--------|-------|------|
| Base | [recommended](#base-recommended) | `@dvashim/biome-config` or `@dvashim/biome-config/recommended` |
| React | [recommended](#react-recommended) | `@dvashim/biome-config/react-recommended` |
| React | [strict](#react-strict) | `@dvashim/biome-config/react-strict` |
| React | [strict-stable](#react-strict-stable) | `@dvashim/biome-config/react-strict-stable` |
| React | [balanced](#react-balanced) | `@dvashim/biome-config/react-balanced` |
| React | [balanced-stable](#react-balanced-stable) | `@dvashim/biome-config/react-balanced-stable` |

_Not sure which to pick? See [Which config should I start with?](#which-config-should-i-start-with) in the FAQ._

## Usage

Add a `biome.json` to your project root and extend a preset. The only line you change between presets is the `extends` path:

```jsonc
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "extends": ["@dvashim/biome-config"]
}
```

To use a different preset, swap the `extends` value for any path from the [Configurations](#configurations) table above — for example `"@dvashim/biome-config/react-balanced"`. The React presets automatically exclude build output (`files.includes: ["**", "!!**/dist"]`); the base preset sets no `files.includes`, so Biome processes all supported files by default.

> The examples use the `latest` schema URL for convenience. To match a preset exactly and silence editor warnings about unknown fields, pin it to the version shown under [Defaults → Schema](#schema).

## Defaults

All configurations share the same base defaults.

### Schema

`https://biomejs.dev/schemas/2.5.5/schema.json`

### Formatter

| Option | Value |
|--------|-------|
| attributePosition | `"auto"` |
| bracketSameLine | `false` |
| bracketSpacing | `true` |
| expand | `"auto"` |
| formatWithErrors | `false` |
| indentStyle | `"space"` |
| indentWidth | `2` |
| lineEnding | `"lf"` |
| lineWidth | `80` |
| useEditorconfig | `true` |

### JavaScript

| Option | Value |
|--------|-------|
| experimentalEmbeddedSnippetsEnabled | `true` |
| jsxRuntime | `"transparent"` |

### JavaScript Formatter

| Option | Value |
|--------|-------|
| arrowParentheses | `"always"` |
| jsxQuoteStyle | `"double"` |
| operatorLinebreak | `"before"` |
| quoteProperties | `"asNeeded"` |
| quoteStyle | `"single"` |
| semicolons | `"asNeeded"` |
| trailingCommas | `"es5"` |

### JSON

| Option | Value |
|--------|-------|
| allowComments | `true` |
| allowTrailingCommas | `true` |

### HTML

| Option | Value |
|--------|-------|
| experimentalFullSupportEnabled | `true` |

### Files (React configs only)

| Option | Value |
|--------|-------|
| includes | `["**", "!!**/dist"]` |

### VCS

| Option | Value |
|--------|-------|
| clientKind | `"git"` |
| enabled | `true` |
| defaultBranch | `"main"` |
| useIgnoreFile | `true` |

### Overrides

| File pattern | Setting | Value |
|------|---------|-------|
| `**/package.json` | assist.actions.source.useSortedKeys | `"off"` |
| `**/package.json` | json.formatter.expand | `"always"` |

### Assist

| Option | Value |
|--------|-------|
| actions.recommended | `true` |
| actions.source.noDuplicateClasses | `"on"` |

## Rules

### Base recommended

Enables all **recommended Biome rules** out of the box with no custom overrides. Provides sensible defaults for code quality, correctness, and best practices across JavaScript, JSX, JSON, and HTML.

---

### React recommended

Same as base recommended, plus enables the **React domain** (`"react": "recommended"`), which activates React-specific recommended rules for hooks, JSX, and component patterns.

---

### React strict

The most opinionated configuration. Enables all recommended rules plus **~250 optional and nursery rules** across 8 categories. Every non-recommended rule that applies to JavaScript/TypeScript/JSX, CSS, HTML, or the **React, Next.js, and React Native** domains is explicitly configured. Rules exclusive to GraphQL or other frameworks (Vue, Solid, Qwik, Svelte) are intentionally omitted.

- **a11y** — Selectively disables noisy rules (`useButtonType`, `useKeyWithClickEvents`, `useSemanticElements`, `noStaticElementInteractions`, `noNoninteractiveElementToInteractiveRole`) and downgrades `useFocusableInteractive` to `info`, while keeping the rest at recommended defaults. Adds `noAmbiguousAnchorText` (promoted from nursery in Biome 2.5.0) and `noNoninteractiveElementInteractions`.

- **complexity** (16 rules) — Monitors cognitive complexity, function length, nested test suites, and logic expressions. Warns on `forEach`, implicit coercions, `void`, and useless patterns. Also prefers `Array#find` (`useArrayFind`) and flags useless returns (`noUselessReturn`), redundant default exports (`noRedundantDefaultExport`), and division-like regexes (`noDivRegex`).

- **correctness** (25 rules) — Ensures no undeclared variables/dependencies, proper React patterns (`noReactPropAssignments`, `noNestedComponentDefinitions`, `noChildrenProp`, `noRenderReturnValue`), React Hooks correctness (`useExhaustiveDependencies`, `useHookAtTopLevel`, `useJsxKeyInIterable`), Node.js guards (`noNodejsModules`, `noProcessGlobal`, `noGlobalDirnameFilename`), and JSON import attributes. `noUnresolvedImports` is disabled since TypeScript already performs these checks. Also flags duplicate JSX attributes (`noDuplicateAttributes`), duplicate enum member names (`noDuplicateEnumValueNames`), unused `new` expressions (`noUnusedInstantiation`), restricted imports/elements (`noPrivateImports`, `noRestrictedElements`), and Next.js issues (`noNextAsyncClientComponent`, `useInlineScriptId`, `noBeforeInteractiveScriptOutsideDocument`).

- **nursery** (72 rules) — Opts into all experimental rules. Highlights include:
  - **Errors:** `noMisusedPromises`
  - **Equality:** `noNegationInEqualityCheck` (flags `!foo === bar`, which precedence parses as `(!foo) === bar` — almost always meant as `foo !== bar`)
  - **Complexity:** `noExcessiveNestedCallbacks`
  - **Promises:** `noFloatingPromises`, `useAwaitThenable`
  - **TypeScript:** `useExhaustiveSwitchCases`, `useExplicitReturnType`, `noMisleadingReturnType`, `noUselessTypeConversion`, `useNullishCoalescing`, `useReduceTypeParameter`
  - **Object/class hygiene:** `noBaseToString` (catches accidental `"[object Object]"` stringification), `useThisInClassMethods`
  - **Resource management:** `useDisposables` (enforces `using` for `Disposable`/`AsyncDisposable`)
  - **Arrays:** `useArraySome`, `useIncludes` (prefer `Array#includes()` over `indexOf()` — new in Biome 2.5.0)
  - **Regex:** `useNamedCaptureGroup`, `useUnicodeRegex`, `useRegexpExec`, `useRegexpTest`
  - **DOM:** `useDomNodeTextContent`, `useDomQuerySelector`
  - **Math:** `useMathMinMax`
  - **Styling:** `noDuplicateSelectors`, `noInlineStyles`, `noExcessiveSelectorClasses`, `noUndeclaredClasses`, `noUnusedClasses`
  - **Testing:** `useConsistentTestIt`, `useExpect`, `noConditionalExpect`, `noIdenticalTestTitle`, `useTestHooksInOrder`, `useTestHooksOnTop`
  - **Playwright:** Full suite of 11 Playwright rules
  - **Drizzle:** `noDrizzleDeleteWithoutWhere`, `noDrizzleUpdateWithoutWhere`
  - **Tailwind:** `useSortedClasses`
  - **React:** `useReactAsyncServerFunction`, `noComponentHookFactories`, `noJsxNamespace`, `noReactStringRefs`, `useReactFunctionComponentDefinition`
  - **React Native:** `noReactNativeRawText`, `noReactNativeLiteralColors`, `noReactNativeDeepImports`, `useReactNativePlatformComponents`
  - **Security:** `useIframeSandbox`
  - **Dependencies:** `noUntrustedLicenses`, `noRestrictedDependencies`
  - **Disabled:** `useExplicitType`

  > Biome 2.5.0 graduated many rules out of nursery; the rules that previously lived here are now configured under their stable categories above (and consequently appear in the `-stable` variants).

- **performance** (11 rules) — Warns on `await` in loops, barrel files, `delete`, namespace imports, re-export all, non-top-level regex, synchronous scripts (`noSyncScripts`), and binding props in JSX (`noJsxPropsBind`, error). Adds Next.js performance rules (`noImgElement`, `noUnwantedPolyfillio`, `useGoogleFontPreconnect`).

- **security** (4 rules) — `noSecrets`, `noScriptUrl`, and React `dangerouslySetInnerHTML` guards (`noDangerouslySetInnerHtml`, `noDangerouslySetInnerHtmlWithChildren`)

- **style** (76 rules) — Enforces consistent syntax, naming conventions (`strictCase: true`), array shorthand syntax, `type` over `interface`, React function components, readonly class properties, `noDefaultExport`, `noMagicNumbers`, `noJsxLiterals`, and more. Now also includes rules promoted from nursery in Biome 2.5.0, such as `noIncrementDecrement`, `noMultiAssign`, `noMultilineString`, `noTernary`, `useDestructuring`, `useErrorCause`, `useGlobalThis`, and `useSpreadOverApply`. Adds `noHexColors`, `noValueAtRule`, `useNodeAssertStrict`, the configurable `noRestrictedGlobals` / `noRestrictedImports` / `noRestrictedTypes` family, and the Next.js `noHeadElement` rule.

- **suspicious** (42 rules) — Flags `var` (error), `console`, `alert`, bitwise operators, empty blocks, import cycles, evolving types, skipped tests, and deprecated imports. Now also includes rules promoted from nursery in Biome 2.5.0, such as `noShadow`, `noUnnecessaryConditions`, `noForIn`, `noEqualsToNull`, `noLeakedRender`, and `noParametersOnlyUsedInRecursion`. Adds `noArrayIndexKey`, test-quality rules (`noFocusedTests`, `noDuplicateTestHooks`, `noExportsInTest`), `useDeprecatedDate`, `useRequiredScripts`, and Next.js document rules (`noDocumentImportInPage`, `noHeadImportInDocument`).

---

### React strict-stable

Same as React strict, but **without nursery (experimental) rules**. Includes rules from 7 categories: a11y, complexity, correctness, performance, security, style, and suspicious.

---

### React balanced

Same rule set as strict, with **targeted relaxations** to reduce false positives and noise in real-world projects:

| Rule | Strict | Balanced | Reason |
|------|--------|----------|--------|
| `noImplicitCoercions` | warn | off | Too noisy with `!!value` patterns |
| `noExcessiveLinesPerFunction` | warn (default) | warn (maxLines: 100) | Higher threshold |
| `noContinue` | warn | info | Informational only |
| `noIncrementDecrement` | warn | warn (allowForLoopAfterthoughts) | Allows `i++` in for loops |
| `noUselessReturn` | warn | info | Informational only |
| `noBarrelFile` | warn | off | Common pattern in libraries |
| `noNamespaceImport` | warn | off | Allows `import * as` |
| `noReExportAll` | warn | off | Common pattern in libraries |
| `noImgElement` | warn | off | Next.js rule; fires on any `<img>` |
| `noDefaultExport` | warn | off | Allows default exports |
| `noImplicitBoolean` | warn | info | Informational only |
| `noJsxLiterals` | warn | off | Allows inline text in JSX |
| `noMagicNumbers` | warn | info | Informational only |
| `noNestedTernary` | warn | off | Allows nested ternaries |
| `useNamingConvention` | strictCase: true | strictCase: false | More lenient casing |

> As of Biome 2.5.0, `noContinue`, `noIncrementDecrement`, and `noUselessReturn` graduated from nursery (to `style`/`complexity`), so these relaxations now also apply in the `-stable` variants.

---

### React balanced-stable

Same as React balanced, but **without nursery (experimental) rules**. All relaxations from the table above still apply.

## FAQ

### Which config should I start with?

- **Non-React projects** — use `@dvashim/biome-config` (base recommended).
- **React projects** — start with `react-balanced` for a good trade-off between strictness and practicality. Move to `react-strict` once your codebase is clean, or `react-recommended` if you only want Biome's built-in defaults. Use the `-stable` variants if you want to avoid nursery (experimental) rules.

### What version of Biome and Node do I need?

These presets are built and tested against **Biome 2.5.5** — the version their `$schema` is pinned to (see [Defaults → Schema](#schema)) — and require **Node.js >= 24**. Biome is not bundled, so install a compatible version yourself:

```bash
pnpm add -D @biomejs/biome@^2.5.5
```

The `$schema` in the examples uses `.../schemas/latest/schema.json` for convenience; pin it to `.../schemas/2.5.5/schema.json` to match the presets exactly and silence editor warnings about unknown fields.

### How do I override a rule from the preset?

Add a `linter.rules` section in your `biome.json`. Local settings merge with and take precedence over the preset:

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "extends": ["@dvashim/biome-config/react-balanced"],
  "linter": {
    "rules": {
      "style": {
        "noDefaultExport": "error"
      }
    }
  }
}
```

### How do I exclude additional files or directories?

The simplest approach is to add paths to your `.gitignore` — all presets enable `vcs.useIgnoreFile`, so Biome respects `.gitignore` patterns automatically.

For exclusions that should not affect Git tracking, use negated patterns in `files.includes`. The `!!` prefix force-ignores paths (prevents scanning entirely), while `!` excludes matches from results:

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "extends": ["@dvashim/biome-config"],
  "files": {
    "includes": ["**", "!!**/generated", "!!**/coverage"]
  }
}
```

### Why does the base config not set `files.includes`?

The base recommended config intentionally omits `files.includes` so consumers control their own file scope. Biome processes all supported files by default when no `includes` is set. The React configs set `files.includes` to `["**", "!!**/dist"]` to explicitly exclude build output.

### Can I use this with TypeScript?

Yes. Biome natively supports TypeScript — no additional configuration is needed. All presets apply to `.ts` and `.tsx` files automatically.

### Can I use this in a monorepo?

Yes. Install the package at the root and reference it in each workspace's `biome.json`. Each workspace can extend a different preset and add its own overrides.

## Contributing

Issues and pull requests are welcome. The repo uses [pnpm](https://pnpm.io) and [Changesets](https://github.com/changesets/changesets):

1. `pnpm install`
2. Edit the presets in `dist/` — they are checked in directly, so there is no build step. After changing `react-strict` or `react-balanced`, run `pnpm run sync-stable` to regenerate the `-stable` variants.
3. `pnpm run check` to validate formatting, package exports, and `-stable` sync.
4. `pnpm changeset` to record a user-facing change.

## License

[MIT](LICENSE)
