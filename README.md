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

### Formatter

- attributePosition: `"auto"`
- bracketSameLine: `false`
- bracketSpacing: `true`
- expand: `"auto"`
- formatWithErrors: `false`
- indentStyle: `"space"`
- indentWidth: `2`
- lineEnding: `"lf"`
- lineWidth: `80`
- useEditorconfig: `true`

### Javascript

- experimentalEmbeddedSnippetsEnabled: `true`
- jsxRuntime: `"transparent"`

### Javascript Formatter

- arrowParentheses: `"always"`
- jsxQuoteStyle: `"double"`
- operatorLinebreak: `"before"`
- quoteProperties: `"asNeeded"`
- quoteStyle: `"single"`
- semicolons: `"asNeeded"`
- trailingCommas: `"es5"`

### Files

- includes: `["**", "!!**/dist"]`

### VCS

- clientKind: `"git"`
- useIgnoreFile: `true`
- defaultBranch: `"main"`

### Assist

- actions:
  - recommended: `true`
  - source
    - noDuplicateClasses: `"on"`

### Schema

- `https://biomejs.dev/schemas/2.4.0/schema.json`

## Rules

### Base recommended configuration

This configuration provides a base setup for linting, formatting, and code consistency across JavaScript, JSX, JSON, and HTML files. Key features include:

- **Linter Rules**

  - Enables all **recommended Biome rules**, providing sensible defaults for code quality, correctness, and best practices without custom overrides.

- **Formatting:**

  - Enforces consistent code style across JavaScript, JSX, JSON, and HTML, including indentation, bracket spacing, quote style, trailing commas, and line width.
  - Supports editorconfig integration to maintain consistent formatting across editors.

- **Assist & Automation:**

  - Enables **recommended automated actions** to streamline development and improve productivity.

- **Version Control (VCS):**

  - Supports Git with `.gitignore` usage and sets `main` as the default branch.

- **File Management:**

  - Includes all project files by default, excluding distribution directories.

---

### React recommended configuration

This configuration provides setup for linting, formatting, and code consistency across JavaScript, JSX, JSON, and HTML files, optimized for React projects. Key features include:

- **Linter Rules**

  - **React Domain:** Applies recommended linting rules for React applications.
  - **General:** Enables all recommended rules for consistent and safe coding practices.

- **Formatting:**

  - Enforces consistent indentation, line endings, bracket style, quote style, arrow function parentheses, operator line breaks, and trailing commas.
  - Supports JavaScript, JSX, JSON, and HTML with editorconfig integration.

- **Assist & Automation:**

  - Enables recommended automated actions to improve developer productivity.

- **Version Control (VCS):**

  - Supports Git with `.gitignore` usage and sets `main` as the default branch.

- **File Management:**

  - Includes all project files by default, excluding distribution directories.

---

### React strict configuration

This configuration enforces strict rules for linting, formatting, and code quality across JavaScript, TypeScript, JSX, JSON, and HTML files. Key features include:

- **Linter Rules**

  - **Accessibility (a11y):** Warns on missing or misused ARIA attributes and alt text; selectively disables certain rules for flexibility.
  - **Complexity:** Monitors cognitive complexity, function length, nested test suites, and logic expressions to maintain readable code.
  - **Correctness:** Ensures no undeclared variables, safe usage of globals, and proper React patterns.
  - **Nursery / Best Practices:** Detects deprecated imports, floating promises, JSX issues, unused expressions, and enforces safer coding patterns.
  - **Performance:** Highlights potential runtime inefficiencies (e.g., `await` in loops, barrel files, `delete` usage).
  - **Security:** Warns on accidental inclusion of secrets in code.
  - **Style & Consistency:** Enforces consistent syntax, naming conventions, array/object patterns, TypeScript typings, and React best practices.
  - **Suspicious / Error-Prone Patterns:** Flags `var` usage, console calls, bitwise operators, empty blocks, and other potentially problematic constructs.

- **Formatting:**

  - Configures indentation, line width, bracket style, quote style, trailing commas, and JSX formatting for consistent code appearance across the project.
  - Supports JavaScript, JSON, HTML, and JSX with editorconfig integration.

- **Assist & Automation:**

  - Enables recommended automated actions to improve developer productivity.

- **Version Control (VCS):**

  - Supports Git with `.gitignore` usage and sets `main` as the default branch.

- **File Management:**

  - Includes all project files by default, excluding distribution directories.
