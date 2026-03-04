# Biome Configurations

[![npm version](https://img.shields.io/npm/v/@dvashim/biome-config.svg?logo=npm&style=flat-square&color2=07c&label=@dvashim/biome-config)](https://www.npmjs.com/package/@dvashim/biome-config) [![npm downloads](https://img.shields.io/npm/dm/@dvashim/biome-config?logo=npm&style=flat-square&color=07c)](https://www.npmjs.com/package/@dvashim/biome-config) [![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat-square&logo=biome&color=07c&logoColor=fff)](https://biomejs.dev)

## Installation

npm:

```bash
npm install -D @dvashim/biome-config
```

or pnpm:

```bash
pnpm add -D @dvashim/biome-config
```

## Configurations

| Domain | Level | Path |
|--------|------------|------|
| Base | recommended | `@dvashim/biome-config` or `@dvashim/biome-config/recommended` |
| React | recommended | `@dvashim/biome-config/react-recommended` |
| React | balanced | `@dvashim/biome-config/react-balanced` |
| React | strict | `@dvashim/biome-config/react-strict` |

<br>

## Use

Base recommended configuration:

```jsonc
// biome.json (Base recommended)
// This configuration provides a base setup for linting,
// formatting, and code consistency across JavaScript,
// JSX, JSON, and HTML files.

{
  "extends": ["@dvashim/biome-config"]
}
```

React recommended configuration:

```jsonc
// biome.json (React recommended)
// This configuration extends the base recommended configuration
// and enables the recommended rules for the React domain

{
  "extends": ["@dvashim/biome-config/react-recommended"]
}
```

React strict configuration:

```jsonc
// biome.json (React strict)
// This configuration enables recommended lint rules,
// including React-specific recommended rules,
// and opts into nursery (experimental) rules.

{
  "extends": ["@dvashim/biome-config/react-strict"]
}
```

React balanced configuration:

```jsonc
// biome.json (React balanced)
// This configuration enables recommended lint rules,
// including React-specific recommended rules,
// with a few rules intentionally disabled
// to reduce false positives / noise.

{
  "extends": ["@dvashim/biome-config/react-balanced"]
}
```

## Defaults

All configurations share the same base defaults.

### Schema

`https://biomejs.dev/schemas/2.4.5/schema.json`

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

### Files

| Option | Value |
|--------|-------|
| includes | `["**", "!!**/dist"]` |

### VCS

| Option | Value |
|--------|-------|
| clientKind | `"git"` |
| defaultBranch | `"main"` |
| useIgnoreFile | `true` |

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

The most opinionated configuration. Enables all recommended rules plus **120+ optional and nursery rules** across 8 categories. Every non-recommended JS/TS rule available in Biome is explicitly configured.

- **a11y** — Selectively disables noisy rules (`useButtonType`, `useKeyWithClickEvents`, `useSemanticElements`, `noStaticElementInteractions`, `noNoninteractiveElementToInteractiveRole`) while keeping the rest at recommended defaults.

- **complexity** (12 rules) — Monitors cognitive complexity, function length, nested test suites, and logic expressions. Warns on `forEach`, implicit coercions, `void`, and useless patterns.

- **correctness** (12 rules) — Ensures no undeclared variables/dependencies/imports, proper React patterns (`noReactPropAssignments`, `noNestedComponentDefinitions`), Node.js guards (`noNodejsModules`, `noProcessGlobal`, `noGlobalDirnameFilename`), and JSON import attributes.

- **nursery** (63 rules) — Opts into all experimental rules. Highlights include:
  - **Errors:** `noJsxPropsBind`, `noLeakedRender`, `noMisusedPromises`, `noMultiAssign`, `noParametersOnlyUsedInRecursion`
  - **Promises:** `noFloatingPromises`, `noNestedPromises`, `useAwaitThenable`
  - **TypeScript:** `useConsistentEnumValueType`, `useConsistentMethodSignatures`, `useExhaustiveSwitchCases`, `useNullishCoalescing`
  - **Regex:** `useNamedCaptureGroup`, `useUnicodeRegex`, `useRegexpExec`
  - **Playwright:** Full suite of 10 Playwright rules
  - **Tailwind:** `useSortedClasses`, `noFloatingClasses`
  - **Disabled:** `noTernary`, `useExplicitType`

- **performance** (6 rules) — Warns on `await` in loops, barrel files, `delete`, namespace imports, re-export all, and non-top-level regex.

- **security** — `noSecrets`

- **style** (44 rules) — Enforces consistent syntax, naming conventions (`strictCase: true`), array shorthand syntax, `type` over `interface`, React function components, readonly class properties, `noDefaultExport`, `noMagicNumbers`, `noJsxLiterals`, and more.

- **suspicious** (22 rules) — Flags `var` (error), `console`, `alert`, bitwise operators, empty blocks, import cycles, evolving types, skipped tests, and deprecated imports.

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
| `noDefaultExport` | warn | off | Allows default exports |
| `noImplicitBoolean` | warn | info | Informational only |
| `noJsxLiterals` | warn | off | Allows inline text in JSX |
| `noMagicNumbers` | warn | info | Informational only |
| `noNestedTernary` | warn | off | Allows nested ternaries |
| `useNamingConvention` | strictCase: true | strictCase: false | More lenient casing |
