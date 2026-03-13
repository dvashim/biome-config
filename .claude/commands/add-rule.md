---
description: Add a Biome linter rule to the dist config files
allowed-tools: Read, Edit, Bash, Grep, Glob
---

Add a new Biome linter rule to the appropriate `dist/` config files.

Parameters (ask the user for the rule name, category and severity. if not already provided as an argument):

1. **Rule name** (required) — e.g. `useBaseline`, `noConsole`
2. **Category** (optional, default: `nursery`) — e.g. `nursery`, `style`, `complexity`, `correctness`, `suspicious`, `performance`, `security`, `a11y`
3. **Severity** (optional, default: `warn`) — one of: `warn`, `error`, `info`, `off`

If the rule name is missing, ask the user and wait for a response before proceeding. Use defaults for category and severity unless the user specifies otherwise.

Once you have all three values, follow these steps:

1. Read the dist config files that contain the specified category:
   - `dist/*.jsonc`

2. Check if the rule already exists in any of the matched files. If it does, update its severity to the new value instead of adding a duplicate entry.

3. If the rule does not exist, insert it in **sorted key order** within the category group. Keys must remain alphabetically sorted. Rules with simple string values (e.g. `"warn"`) go before rules with object values (e.g. `{ "level": "warn", "options": { ... } }`).

4. Run `pnpm run check` to verify formatting and exports still pass.

5. Report which files were updated.
