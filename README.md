# Biome Configurations

[![npm version](https://img.shields.io/npm/v/@dvashim/biome-config.svg?logo=npm&style=flat-square&color2=07c)](https://www.npmjs.com/package/@dvashim/biome-config) [![npm downloads](https://img.shields.io/npm/dm/@dvashim/biome-config?logo=npm&style=flat-square&color=07c)](https://www.npmjs.com/package/@dvashim/biome-config) [![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat-square&logo=biome&color=07c&logoColor=fff)](https://biomejs.dev)

## Installation

To install this package, you can use npm:

```bash
npm install -D @dvashim/biome-config
```

or pnpm:

```bash
pnpm add -D @dvashim/biome-config
```

## Provided configurations

| Name | Path |
|------|------|
| [Base recommended configuration](#base-recommended-configuration) | `@dvashim/biome-config` or `@dvashim/biome-config/recommended` |
| [React recommended configuration](#react-recommended-configuration) | `@dvashim/biome-config/react/recommended` |
| [React strict configuration](#react-strict-configuration) | `@dvashim/biome-config/react/strict` |

## Using Biome configurations

### Base recommended configuration

This configuration provides a base setup for linting, formatting, and code consistency across JavaScript, JSX, JSON, and HTML files. Key features include:

* **Linter Rules**

  * Enables all **recommended Biome rules**, providing sensible defaults for code quality, correctness, and best practices without custom overrides.

* **Formatting:**

  * Enforces consistent code style across JavaScript, JSX, JSON, and HTML, including indentation, bracket spacing, quote style, trailing commas, and line width.
  * Supports editorconfig integration to maintain consistent formatting across editors.

* **Assist & Automation:**

  * Enables **recommended automated actions** to streamline development and improve productivity.

* **Version Control (VCS):**

  * Supports Git with `.gitignore` usage and sets `main` as the default branch.

* **File Management:**

  * Includes all project files by default, excluding distribution directories.

This setup provides a robust, opinionated baseline for projects, ensuring readable, maintainable, and consistent code while enforcing Biome’s recommended practices.

```jsonc
// biome.json
{
  "extends": ["@dvashim/biome-config"]
}
```

### React recommended configuration

This configuration provides setup for linting, formatting, and code consistency across JavaScript, JSX, JSON, and HTML files, optimized for React projects. Key features include:

* **Linter Rules**

  * **React Domain:** Applies recommended linting rules for React applications.
  * **General:** Enables all recommended rules for consistent and safe coding practices.

* **Formatting:**

  * Enforces consistent indentation, line endings, bracket style, quote style, arrow function parentheses, operator line breaks, and trailing commas.
  * Supports JavaScript, JSX, JSON, and HTML with editorconfig integration.

* **Assist & Automation:**

  * Enables recommended automated actions to improve developer productivity.

* **Version Control (VCS):**

  * Supports Git with `.gitignore` usage and sets `main` as the default branch.

* **File Management:**

  * Includes all project files by default, excluding distribution directories.

This setup ensures a clean, maintainable, and React-ready codebase, focusing on recommended best practices and consistent formatting.

```jsonc
// biome.json
{
  "extends": ["@dvashim/biome-config/react/recommended"]
}
```

### React strict configuration

This configuration enforces strict rules for linting, formatting, and code quality across JavaScript, TypeScript, JSX, JSON, and HTML files. Key features include:

* **Linter Rules**

  * **Accessibility (a11y):** Warns on missing or misused ARIA attributes and alt text; selectively disables certain rules for flexibility.
  * **Complexity:** Monitors cognitive complexity, function length, nested test suites, and logic expressions to maintain readable code.
  * **Correctness:** Ensures no undeclared variables, safe usage of globals, and proper React patterns.
  * **Nursery / Best Practices:** Detects deprecated imports, floating promises, JSX issues, unused expressions, and enforces safer coding patterns.
  * **Performance:** Highlights potential runtime inefficiencies (e.g., `await` in loops, barrel files, `delete` usage).
  * **Security:** Warns on accidental inclusion of secrets in code.
  * **Style & Consistency:** Enforces consistent syntax, naming conventions, array/object patterns, TypeScript typings, and React best practices.
  * **Suspicious / Error-Prone Patterns:** Flags `var` usage, console calls, bitwise operators, empty blocks, and other potentially problematic constructs.

* **Formatting:**

  * Configures indentation, line width, bracket style, quote style, trailing commas, and JSX formatting for consistent code appearance across the project.
  * Supports JavaScript, JSON, HTML, and JSX with editorconfig integration.

* **Assist & Automation:**

  * Enables recommended automated actions to improve developer productivity.

* **Version Control (VCS):**

  * Supports Git with `.gitignore` usage and sets `main` as the default branch.

* **File Management:**

  * Includes all project files by default, excluding distribution directories.

This setup ensures a consistent, maintainable, and high-quality codebase while enforcing best practices across accessibility, performance, security, and style.

```jsonc
// biome.json
{
  "extends": ["@dvashim/biome-config/react/strict"]
}
```
