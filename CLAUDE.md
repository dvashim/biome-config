# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shared Biome configuration presets published as `@dvashim/biome-config` on npm. The package distributes pre-built JSON config files (in `dist/`) that consumers extend in their `biome.json`.

Despite the name, `dist/` is **source** — the JSON files are checked into the repo and published as-is. There is no build step and no test suite.

## Commands

- **Check all (format + publint + stable sync + types):** `pnpm run check` (runs every `check:*` script via `pnpm run "/^check:.*/"`)
- **Check formatting only:** `pnpm run check:format`
- **Fix formatting:** `biome format --write`
- **Fix formatting + key order (applies the `useSortedKeys` assist):** `biome check --write`
- **Lint packaging correctness (publint):** `pnpm run check:publint`
- **Check `-stable` drift only:** `pnpm run check:sync-stable`
- **Regenerate `-stable` variants from their parents:** `pnpm run sync-stable`
- **Create a changeset:** `pnpm changeset`
- **Per-category rule counts (for keeping README in sync):**
  `node -e "const r=require('./dist/biome.react-strict.json').linter.rules;for(const[k,v]of Object.entries(r))if(typeof v==='object')console.log(k,Object.keys(v).length)"`

`scripts/sync-stable.ts` runs directly on Node via native type stripping (engines require Node ≥24) and is type-checked by `check:types` (`tsc --noEmit`). CI runs `pnpm run check` on all PRs targeting `main`, and again on push to `main` before release.

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

All six configs share identical `$schema` / `assist` / `formatter` / `html` / `javascript` / `json` / `overrides` / `vcs` blocks — a change to any of those must be applied to all six. They differ only in `files` and in linter rules:

- **recommended** — Only Biome's built-in recommended rules. No domain-specific settings. Intentionally omits a `files` section so consumers control their own includes/excludes.
- **react-recommended** — Same as recommended + `"domains": { "react": "recommended" }`. Adds `"files": { "includes": ["**", "!!**/dist"] }` (shared by all react configs).
- **react-strict** — 254 explicit rule entries across 8 categories (72 of them nursery). Unlike `react-recommended`, strict/balanced set **no** `domains` key; React / Next.js / React Native rules are enabled by listing them individually.
- **react-balanced** — Same rule *set* as strict (also 254) with ~15 targeted relaxations for common patterns (barrel files, default exports, namespace imports, magic numbers, etc.). See the relaxation table in `README.md`.
- **react-strict-stable** / **react-balanced-stable** — Same as their parents but without nursery (experimental) rules (182 entries each). Auto-derived by `scripts/sync-stable.ts`; **do not edit by hand.**

### Rule-list design

`react-strict` / `react-balanced` do **not** set `linter.rules.recommended` (so Biome's implicit `recommended: true` baseline applies) and set no `domains` key. Their explicit lists therefore hold only **opt-in** rules: non-recommended rules they enable, plus deliberate overrides of recommended rules (a non-default severity, options, or `"off"` to disable one). A recommended **stable** rule listed at its default severity is redundant and should not appear. **Nursery rules are always opt-in** — `recommended: true` never enables nursery, which is also why the `-stable` variants (nursery stripped) drop to Biome's recommended baseline plus the stable opt-ins. Use `biome explain <rule>` for a rule's diagnostic category, default severity, recommended status, and domains.

Scope of the explicit lists (formalized in `openspec/specs/linter-rule-coverage/spec.md`):

- **In scope** — every non-recommended rule targeting `js`, `ts`, `css`, `html`, `json`, or `jsonc`, or belonging to the React, Next.js, React Native, `test`, or `project` domains.
- **Out of scope** — GraphQL-only rules, and rules whose only domain is `vue`, `solid`, `qwik`, `svelte`, or `astro`.
- **Severity convention** — new rules land at `warn` in `react-strict`; `react-balanced` relaxes purely stylistic, high-noise, or broadly-firing framework rules to `info` or `off`. Because framework rules are listed individually rather than domain-gated, they fire outside their framework (e.g. `noImgElement` on any `<img>`) — that is why balanced relaxes them.

### scripts/sync-stable.ts

Derives each `-stable` file from its parent: parse JSON → `delete linter.rules.nursery` → re-serialize → pipe through `biome format --stdin-file-path=<dest>` → re-insert a blank line before each top-level key. Those blank lines between top-level blocks are load-bearing for the byte-exact comparison, so `-stable` files must be regenerated, never hand-edited or hand-reformatted. `--check` compares instead of writing and exits 1 on drift.

### Root biome.json

The repo's own `biome.json` extends `dist/biome.recommended.json` (with `"root": true`) to dogfood the config — editing the recommended preset changes how this repo checks itself. Notable settings:

- `useSortedKeys` assist with `groupByNesting` for maintaining key order in the dist JSON files.
- `overrides` for expanded JSON formatting on `.claude/settings.local.json` (repo-specific; `package.json` override is in the dist configs).

### Shared overrides (in dist configs)

All dist configs include a `package.json` override that:

- Sets `json.formatter.expand` to `"always"` (one entry per line).
- Disables `assist.actions.source.useSortedKeys` (package.json uses conventional, non-alphabetical key order).

## OpenSpec workflow

Non-trivial work is planned as an OpenSpec change (schema: `spec-driven`, CLI `openspec`, config in `openspec/config.yaml`):

- `openspec/specs/<capability>/spec.md` — the standing requirements. Two capabilities exist: **linter-rule-coverage** (which rules belong in the presets, how upgrades reconcile them, changeset sizing, README sync) and **dev-tooling-currency** (devDependencies / pnpm / OpenSpec CLI track latest stable). Read the relevant spec before changing preset rules or bumping Biome — most conventions below are enforced there.
- `openspec/changes/<name>/` — an in-flight change (`proposal.md`, `design.md`, `tasks.md`, delta `specs/`), archived to `openspec/changes/archive/<YYYY-MM-DD>-<name>/` when done. Archiving syncs the delta spec into the main spec and moves the directory in one step.
- Skills/commands: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:sync`, `/opsx:explore`.

`.claude/commands/opsx/*.md` and `.claude/skills/openspec-*/SKILL.md` are **generated by the OpenSpec CLI** (`openspec update`) — never hand-edit them. Each skill's `metadata.generatedBy` must match the installed CLI version; drift means they need regenerating, and the regenerated files get committed with the CLI bump.

## Slash commands

- `/add-rule` — Add a Biome linter rule to the dist config files. Asks for rule name (required), category (default: `nursery`), and severity (default: `warn`). Handles both inserting new rules and updating existing ones.

## Key conventions

- Config files in `dist/` must have keys sorted (via the `useSortedKeys` assist in `biome.json`). Because of `groupByNesting`, rules with simple string values (e.g. `"warn"`) must appear **before** rules with object values (e.g. `{ "level": "warn", "options": { ... } }`) within the same category — see the tail of `style` in `react-balanced.json` (`noIncrementDecrement`, `useConsistentArrayType`, `useConsistentTypeDefinitions`, `useNamingConvention` follow the string-valued entries). Note: `pnpm check` runs `biome format` and does **not** verify key order; run `biome check --write` (not just `biome format --write`) to actually apply the sort.
- **Biome version upgrades** require updating the `$schema` URL in all six dist files, `biome.json`, and `README.md`, plus the `@biomejs/biome` devDependency. Also check the Biome changelog for new linter rules and add them to `react-strict` and `react-balanced` (these have explicit rule lists; `recommended` and `react-recommended` use `"recommended": true` and pick up new rules automatically). Diffing the rule keys of the old and new `configuration_schema.json` is the reliable way to find additions. Across a minor/major upgrade, also reconcile rules that **graduated** from `nursery` to a stable category (relocate the entry, preserving each preset's severity — it then starts appearing in the `-stable` variants), were **renamed** (migrate to the new name, preserving severity), or were **removed** (drop them). After editing `react-strict` or `react-balanced`, run `pnpm sync-stable`; `pnpm check` fails on drift via `check:sync-stable`.
- **README is part of the contract.** Its per-category rule counts must equal what `react-strict` lists, and every rule it names must exist in that preset. Any rule-list change updates the affected counts, highlights, and the balanced relaxation table in the same change.
- Versioning uses [Changesets](https://github.com/changesets/changesets). Size it by published impact: **minor** when a preset rule list changes (rules added/removed/renamed/re-leveled — consumers' diagnostics change), **patch** when only the `$schema` target advances with no rule-list change, and **no changeset** when nothing in `dist/*.json` or `README.md` changed (dev deps, root `biome.json`, planning artifacts, regenerated tooling assets). The changeset config has `"commit": true`, so `pnpm changeset` auto-commits.
- Work lands via PR to `main`; Changesets opens the release PR automatically on push to `main`.
- Package manager is **pnpm**. CI installs with `pnpm ci` — a real pnpm 11 command, not a typo for `npm ci`; do not "fix" it. The release workflow deliberately pins Node `24.16.0` (see the comment in `release.yml` — a bundled-undici regression in 24.17.0 breaks `changeset version`); leave the pin alone unless verifying that regression is fixed.
