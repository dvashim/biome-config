# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shared Biome configuration presets published as `@dvashim/biome-config` on npm. The package distributes pre-built JSON config files (in `dist/`) that consumers extend in their `biome.json`.

## Commands

- **Check all (format + exports):** `pnpm run check`
- **Check formatting only:** `pnpm run check:format`
- **Fix formatting:** `biome format --write`
- **Validate package exports:** `pnpm run check:exports`
- **Create a changeset:** `pnpm changeset`

There is no build step or test suite. The `dist/` JSON files are checked into the repo directly. CI runs `pnpm run check` on all PR branches targeting `main`.

## Architecture

The package exports six Biome config presets via `dist/`:

| Export path | File |
|---|---|
| `.` / `./recommended` | `dist/biome.recommended.json` |
| `./react-recommended` / `./react/recommended` | `dist/biome.react-recommended.json` |
| `./react-balanced` / `./react/balanced` | `dist/biome.react-balanced.json` |
| `./react-strict` / `./react/strict` | `dist/biome.react-strict.json` |
| `./react-strict-stable` / `./react/strict-stable` | `dist/biome.react-strict-stable.json` |
| `./react-balanced-stable` / `./react/balanced-stable` | `dist/biome.react-balanced-stable.json` |

### Config hierarchy

All six configs share identical formatter/VCS/files/overrides settings. They differ only in linter rules:

- **recommended** — Only Biome's built-in recommended rules. No domain-specific settings. Intentionally omits a `files` section so consumers control their own includes/excludes.
- **react-recommended** — Same as recommended + `"domains": { "react": "recommended" }`. Adds `"files": { "includes": ["**", "!!**/dist"] }` (shared by all react configs).
- **react-strict** — React domain enabled + 200+ explicit rule configurations across all categories.
- **react-balanced** — Same rules as strict but with targeted relaxations for common patterns (barrel files, default exports, namespace imports, magic numbers, etc.).
- **react-strict-stable** — Same as react-strict but without nursery (experimental) rules.
- **react-balanced-stable** — Same as react-balanced but without nursery (experimental) rules.

### Root biome.json

The repo's own `biome.json` extends `dist/biome.recommended.json` (with `"root": true`) to dogfood the config. Notable settings:

- `useSortedKeys` assist with `groupByNesting` for maintaining key order in the dist JSON files.
- `overrides` for expanded JSON formatting on `.claude/settings.local.json` (repo-specific; `package.json` override is in the dist configs).

### Shared overrides (in dist configs)

All dist configs include a `package.json` override that:

- Sets `json.formatter.expand` to `"always"` (one entry per line).
- Disables `assist.actions.source.useSortedKeys` (package.json uses conventional, non-alphabetical key order).

## Slash commands

- `/add-rule` — Add a Biome linter rule to the dist config files. Asks for rule name (required), category (default: `nursery`), and severity (default: `warn`). Handles both inserting new rules and updating existing ones.

## Key conventions

- Config files in `dist/` must have keys sorted (enforced by `useSortedKeys` in `biome.json`). Because of `groupByNesting`, rules with simple string values (e.g. `"warn"`) must appear **before** rules with object values (e.g. `{ "level": "warn", "options": { ... } }`) within the same category — see `noIncrementDecrement` at the end of nursery in `react-balanced.json` for an example.
- **Biome version upgrades** require updating the `$schema` URL in all six dist files, `biome.json`, and `README.md`. Also check the Biome changelog for new linter rules and add them to `react-strict` and `react-balanced` configs (these have explicit rule lists; `recommended` and `react-recommended` use `"recommended": true` and pick up new rules automatically). The `-stable` variants are manually kept in sync with their non-stable counterparts minus nursery rules.
- Versioning uses [Changesets](https://github.com/changesets/changesets) — create a changeset for any user-facing change. The changeset config has `"commit": true`, so `pnpm changeset` auto-commits.
- Package manager is **pnpm**.
