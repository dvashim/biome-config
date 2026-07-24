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

- **One line to adopt** — `extends` a preset and inherit the formatter, linter, and assist settings together.
- **A ladder, not a single opinion** — six presets, from Biome's own recommended baseline up to 254 explicitly configured rules.
- **React, Next.js, and React Native** — framework rules are enabled by name, so they apply without relying on domain auto-detection.
- **Nursery-free `-stable` variants** — the same rule sets minus Biome's experimental rules, for teams that want a surface that will not shift under them.
- **Plain JSON, no runtime dependencies** — the presets are published as config files; Biome is the only thing installed alongside them.
- **Dogfooded** — this repository formats and lints itself with the base preset.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configurations](#configurations)
- [Usage](#usage)
- [Defaults](#defaults)
- [Rules](#rules)
- [FAQ](#faq)
- [Versioning](#versioning)
- [Contributing](#contributing)
- [License](#license)

## Requirements

| Dependency | Version |
|---|---|
| [Biome](https://biomejs.dev) | **2.5.5+** — the release the presets target |
| Node.js | **>= 24** — declared in the package's `engines` |

Biome is not bundled, so install a compatible version yourself. The presets pin their `$schema` to `https://biomejs.dev/schemas/2.5.5/schema.json`; using that same URL in your own `biome.json` matches the presets exactly and silences editor warnings about unknown fields.

## Installation

Install the presets together with Biome as dev dependencies:

```bash
# npm
npm install -D @dvashim/biome-config @biomejs/biome

# pnpm
pnpm add -D @dvashim/biome-config @biomejs/biome

# yarn
yarn add -D @dvashim/biome-config @biomejs/biome

# bun
bun add -d @dvashim/biome-config @biomejs/biome
```

## Configurations

| Preset | `extends` path | Explicit rules | Nursery |
|--------|----------------|----------------|---------|
| [Base recommended](#base-recommended) | `@dvashim/biome-config` | Biome recommended only | — |
| [React recommended](#react-recommended) | `@dvashim/biome-config/react-recommended` | Biome recommended + React domain | — |
| [React strict](#react-strict) | `@dvashim/biome-config/react-strict` | 254 | 72 |
| [React strict-stable](#react-strict-stable) | `@dvashim/biome-config/react-strict-stable` | 182 | — |
| [React balanced](#react-balanced) | `@dvashim/biome-config/react-balanced` | 254, 15 relaxed | 72 |
| [React balanced-stable](#react-balanced-stable) | `@dvashim/biome-config/react-balanced-stable` | 182, 15 relaxed | — |

"Explicit rules" counts the entries a preset configures itself; Biome's recommended rules stay active in every preset on top of them. All six share the same [formatter, parser, VCS, and assist defaults](#defaults).

Each preset has a second export path with a slash — `@dvashim/biome-config/react/balanced` is the same file as `@dvashim/biome-config/react-balanced` — and the base config is also exported as `@dvashim/biome-config/recommended`.

_Not sure which to pick? See [Which config should I start with?](#which-config-should-i-start-with) in the FAQ._

## Usage

Add a `biome.json` to your project root and extend a preset. The `extends` path is the only line that changes between presets:

```jsonc
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.5.5/schema.json",
  "extends": ["@dvashim/biome-config"]
}
```

Then run Biome:

```bash
pnpm exec biome check          # report formatting, lint, and assist issues
pnpm exec biome check --write  # apply the safe fixes
```

Or wire it into your `package.json`:

```json
{
  "scripts": {
    "check": "biome check",
    "fix": "biome check --write",
    "format": "biome format --write"
  }
}
```

For format-on-save and inline diagnostics, install Biome's [first-party editor extension](https://biomejs.dev/guides/editors/first-party-extensions/).

> **Note:** The React presets automatically exclude build output (`files.includes: ["**", "!!**/dist"]`); the base preset sets no `files.includes`, so Biome processes all supported files by default.

## Defaults

All six configurations share the same base defaults — they differ only in `files.includes` and linter rules.

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

### JavaScript formatter

| Option | Value |
|--------|-------|
| arrowParentheses | `"always"` |
| jsxQuoteStyle | `"double"` |
| operatorLinebreak | `"before"` |
| quoteProperties | `"asNeeded"` |
| quoteStyle | `"single"` |
| semicolons | `"asNeeded"` |
| trailingCommas | `"es5"` |

<details>
<summary><strong>Parsers, files, VCS, assist, and overrides</strong></summary>

#### JavaScript

| Option | Value |
|--------|-------|
| experimentalEmbeddedSnippetsEnabled | `true` |
| globals | `[]` |
| jsxRuntime | `"transparent"` |
| parser.gritMetavariables | `false` |
| parser.jsxEverywhere | `true` |
| parser.unsafeParameterDecoratorsEnabled | `false` |

#### JSON parser

| Option | Value |
|--------|-------|
| allowComments | `true` |
| allowTrailingCommas | `true` |

#### HTML

| Option | Value |
|--------|-------|
| experimentalFullSupportEnabled | `true` |

#### Files (React presets only)

| Option | Value |
|--------|-------|
| includes | `["**", "!!**/dist"]` |

#### VCS

| Option | Value |
|--------|-------|
| clientKind | `"git"` |
| enabled | `true` |
| defaultBranch | `"main"` |
| useIgnoreFile | `true` |

#### Assist

| Option | Value |
|--------|-------|
| actions.recommended | `true` |
| actions.source.noDuplicateClasses | `"on"` |

#### Overrides

| File pattern | Setting | Value |
|------|---------|-------|
| `**/package.json` | assist.actions.source.useSortedKeys | `"off"` |
| `**/package.json` | json.formatter.expand | `"always"` |

</details>

## Rules

### Base recommended

Enables all **recommended Biome rules** out of the box with no custom overrides. Provides sensible defaults for code quality, correctness, and best practices across JavaScript, JSX, JSON, and HTML.

---

### React recommended

Same as base recommended, plus enables the **React domain** (`"react": "recommended"`), which activates React-specific recommended rules for hooks, JSX, and component patterns.

---

### React strict

The most opinionated configuration. Enables all recommended rules plus **254 optional and nursery rules** across 8 categories. Every non-recommended rule that applies to JavaScript/TypeScript/JSX, CSS, HTML, JSON, or the **React, Next.js, and React Native** domains is explicitly configured. Rules exclusive to GraphQL or other frameworks (Vue, Solid, Qwik, Svelte) are intentionally omitted.

- **a11y** (8 rules) — Selectively disables noisy rules (`useButtonType`, `useKeyWithClickEvents`, `useSemanticElements`, `noStaticElementInteractions`, `noNoninteractiveElementToInteractiveRole`) and downgrades `useFocusableInteractive` to `info`, while keeping the rest at recommended defaults. Adds `noAmbiguousAnchorText` (promoted from nursery in Biome 2.5.0) and `noNoninteractiveElementInteractions`.

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

Same as React strict, but **without nursery (experimental) rules** — 182 rules across 7 categories: a11y, complexity, correctness, performance, security, style, and suspicious.

---

### React balanced

Same rule set as strict, with **15 targeted relaxations** to reduce false positives and noise in real-world projects:

| Category | Rule | Strict | Balanced | Reason |
|----------|------|--------|----------|--------|
| complexity | `noExcessiveLinesPerFunction` | warn (default) | warn (maxLines: 100) | Higher threshold |
| complexity | `noImplicitCoercions` | warn | off | Too noisy with `!!value` patterns |
| complexity | `noUselessReturn` | warn | info | Informational only |
| performance | `noBarrelFile` | warn | off | Common pattern in libraries |
| performance | `noImgElement` | warn | off | Next.js rule; fires on any `<img>` |
| performance | `noNamespaceImport` | warn | off | Allows `import * as` |
| performance | `noReExportAll` | warn | off | Common pattern in libraries |
| style | `noContinue` | warn | info | Informational only |
| style | `noDefaultExport` | warn | off | Allows default exports |
| style | `noImplicitBoolean` | warn | info | Informational only |
| style | `noIncrementDecrement` | warn | warn (allowForLoopAfterthoughts) | Allows `i++` in for loops |
| style | `noJsxLiterals` | warn | off | Allows inline text in JSX |
| style | `noMagicNumbers` | warn | info | Informational only |
| style | `noNestedTernary` | warn | off | Allows nested ternaries |
| style | `useNamingConvention` | strictCase: true | strictCase: false | More lenient casing |

> Every relaxation lives in a stable category, so all 15 apply in `react-balanced-stable` as well.

---

### React balanced-stable

Same as React balanced, but **without nursery (experimental) rules** — 182 rules, with all relaxations from the table above still applied.

## FAQ

### Which config should I start with?

- **Non-React projects** — use `@dvashim/biome-config` (base recommended).
- **React projects** — start with `react-balanced` for a good trade-off between strictness and practicality. Move to `react-strict` once your codebase is clean, or `react-recommended` if you only want Biome's built-in defaults. Use the `-stable` variants if you want to avoid nursery (experimental) rules.

### What version of Biome and Node do I need?

These presets are built and tested against **Biome 2.5.5** — the version their `$schema` is pinned to (see [Requirements](#requirements)) — and require **Node.js >= 24**. Biome is not bundled, so install a compatible version yourself:

```bash
pnpm add -D @biomejs/biome@^2.5.5
```

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

The [Rules](#rules) section lists each rule under its category, which is the key you need for the override.

### Why do I see Next.js diagnostics in a project that is not Next.js?

`react-strict` and `react-balanced` set no [`domains`](https://biomejs.dev/linter/domains/) key — every framework rule is enabled by name instead of by domain detection, so it applies to all your files. A few of them fire on patterns that are fine outside their framework; `noImgElement` flagging any `<img>` is the usual one.

`react-balanced` already turns the broadest ones off. To silence one yourself, override it by category:

```jsonc
{
  "extends": ["@dvashim/biome-config/react-strict"],
  "linter": {
    "rules": {
      "performance": {
        "noImgElement": "off"
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

### How do I migrate from ESLint and Prettier?

Extend a preset first, then let Biome import whatever your existing setup configured on top of it:

```bash
pnpm exec biome migrate eslint --write
pnpm exec biome migrate prettier --write
```

See Biome's [migration guide](https://biomejs.dev/guides/migrate-eslint-prettier/) for the details and known gaps.

## Versioning

Releases are sized by the effect they have on the diagnostics you receive:

- **minor** — a preset's rule list changed: a rule was added, removed, renamed, or re-leveled. Expect new or different diagnostics.
- **patch** — the presets moved to a newer Biome release with no rule-list change, or documentation was corrected.

Because a minor release can surface new warnings, pin the version if your CI treats lint output as a hard failure. The [CHANGELOG](https://github.com/dvashim/biome-config/blob/main/CHANGELOG.md) records the rules each release touched.

## Contributing

Issues and pull requests are welcome. The repo uses [pnpm](https://pnpm.io) and [Changesets](https://github.com/changesets/changesets):

1. `pnpm install`
2. Edit the presets in `dist/` — they are checked in directly, so there is no build step. After changing `react-strict` or `react-balanced`, run `pnpm run sync-stable` to regenerate the `-stable` variants.
3. `biome check --write` to apply formatting and the sorted-key assist.
4. `pnpm run check` to validate formatting, package exports, `-stable` sync, and types.
5. `pnpm changeset` to record a user-facing change.

To report a security issue, see [SECURITY.md](https://github.com/dvashim/biome-config/blob/main/SECURITY.md).

## License

[MIT](LICENSE)
