# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shared Biome configuration presets published as `@dvashim/biome-config` on npm. The package distributes pre-built JSONC config files (in `dist/`) that consumers extend in their `biome.json`.

## Commands

- **Check all (format + exports):** `pnpm run check`
- **Check formatting only:** `pnpm run check:format`
- **Validate package exports:** `pnpm run check:exports`
- **Create a changeset:** `pnpm changeset`

There is no build step or test suite. The `dist/` JSONC files are checked into the repo directly.

## Architecture

The package exports four Biome config presets via `dist/`:

| Export path | File |
|---|---|
| `.` / `./recommended` | `dist/biome.recommended.jsonc` |
| `./react-recommended` / `./react/recommended` | `dist/biome.react-recommended.jsonc` |
| `./react-balanced` / `./react/balanced` | `dist/biome.react-balanced.jsonc` |
| `./react-strict` / `./react/strict` | `dist/biome.react-strict.jsonc` |

### Config hierarchy

All four configs share identical formatter/VCS/files settings. They differ only in linter rules:

- **recommended** — Only Biome's built-in recommended rules. No domain-specific settings.
- **react-recommended** — Same as recommended + `"domains": { "react": "recommended" }`.
- **react-strict** — React domain enabled + 180+ explicit rule configurations across all categories.
- **react-balanced** — Same rules as strict but with targeted relaxations for common patterns (barrel files, default exports, namespace imports, magic numbers, etc.).

### Root biome.json

The repo's own `biome.json` extends `dist/biome.recommended.jsonc` to dogfood the config. Notable settings:

- `useSortedKeys` assist for maintaining key order in the dist JSONC files.
- `files.includes: ["**/dist"]` — Biome only processes the dist directory.
- `overrides` for expanded JSON formatting on `package.json` and settings files.

## Slash commands

- `/add-rule` — Add a Biome linter rule to the dist config files. Asks for rule name (required), category (default: `nursery`), and severity (default: `warn`). Handles both inserting new rules and updating existing ones.

## Key conventions

- Config files in `dist/` use JSONC format (JSON with comments) and must have keys sorted (enforced by `useSortedKeys` in `biome.json`).
- Each section in dist JSONC files is marked with `// MARK:` comments for navigation.
- The `$schema` URL in each dist file must match the current Biome version. When upgrading Biome, update the schema URL in all four dist files, `biome.json`, and `README.md`.
- Versioning uses [Changesets](https://github.com/changesets/changesets) — create a changeset for any user-facing change.
- Package manager is **pnpm**.
- `TODO` file tracks pending rules/features using a checkbox format grouped by Biome version.
