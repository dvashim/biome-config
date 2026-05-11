---
"@dvashim/biome-config": minor
---

Bump Biome from 2.4.14 to 2.4.15. Update `$schema` URLs across all configs, `biome.json`, and README. Add three new nursery rules to `react-strict` and `react-balanced` configs:

- `noBaseToString` — flag stringification sites that fall back to Object's default `"[object Object]"` formatting (e.g. `` `${obj}` ``, `String(obj)`, `obj + ""`) so the issue surfaces at the cast site instead of in logs/UI.
- `useTestHooksInOrder` — enforce that Jest/Vitest lifecycle hooks (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`) are declared in the order they execute, making setup and teardown easier to reason about.
- `useThisInClassMethods` — flag instance methods, getters, setters, and function-valued instance fields that don't use `this`; based on ESLint's `class-methods-use-this`.

The four Vue-only rules from 2.4.15 (`useVueNextTickPromise`, `noVueVOnNumberValues`, `useVueValidVFor`, `noVueImportCompilerMacros`) are intentionally omitted — this package targets React.

**Tooling (maintainer-only, no consumer impact):**

- Add `scripts/sync-stable.mjs` plus `pnpm sync-stable` and `pnpm check:sync-stable` package scripts. The `-stable` variants of `react-strict` and `react-balanced` are now auto-derived from their parent configs (parent minus the `nursery` section); the `check:sync-stable` script runs as part of `pnpm check` and fails CI on drift, so manual edits to `-stable` files no longer compile cleanly without a corresponding parent edit.
- Disable the "Thanks @user!" attribution line in generated CHANGELOG entries via `disableThanks: true` in `.changeset/config.json`.
