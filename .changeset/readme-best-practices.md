---
"@dvashim/biome-config": patch
---

Documentation only — no preset rule or setting changed.

Restructure the README around the questions a consumer actually arrives with: a promoted **Requirements** section, install commands for npm/pnpm/yarn/bun, and a **Usage** section that now shows how to *run* Biome (`biome check`, `--write`, `package.json` scripts, editor extension) rather than stopping at the `extends` line. The **Configurations** table gains explicit rule counts per preset and documents the previously unlisted `react/<level>` slash export paths.

Corrections and additions:

- The strict preset is described as **254 rules** (was "~250"), and its scope now names JSON alongside JS/TS/JSX, CSS, and HTML.
- The **a11y** bullet carries its rule count (8), matching every other category.
- The balanced relaxation table gains a **Category** column — the key needed to override a rule — and is sorted by category.
- The defaults tables now document `javascript.globals` and the `javascript.parser` options, and the JSON table is labelled as parser options. Reference tables beyond the formatter settings moved into a collapsible block.
- New FAQ entries: why Next.js diagnostics appear in non-Next.js projects (framework rules are enabled by name, not by domain detection) and how to migrate from ESLint/Prettier.
- New **Versioning** section stating what makes a release minor (a rule-list change) versus patch, with a link to the changelog.
