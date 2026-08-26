## 1. Advance the pinned target

- [x] 1.1 Update the `$schema` URL from `2.5.9` to `2.5.10` in all six `dist/*.json` presets and in the root `biome.json`; verify `grep -rl 'schemas/2\.5\.9/' dist/ biome.json` returns nothing
- [x] 1.2 Update the seven `README.md` version references — the requirements-table `**2.5.9+**`, the `$schema` prose, the three `biome.json` examples, the "built and tested against **Biome 2.5.9**" line, and the `pnpm add -D @biomejs/biome@^2.5.9` snippet. Verify the five historical "in Biome 2.5.0" mentions are **left alone**: they record when rules graduated, not the target
- [x] 1.3 Confirm the `@biomejs/biome` devDependency is already `^2.5.10` and needs no edit; record that it was adopted rather than bumped
- [x] 1.4 Run `pnpm sync-stable` and verify both `-stable` files change **only** in their `$schema` line, and that `pnpm run check:sync-stable` reports no drift

## 2. Regenerate the rule metadata

- [x] 2.1 Run `pnpm sync-rule-metadata` **after** the `$schema` edit, with no `--biome` override — the script refuses when the target and the installed binary disagree, so running it first will (correctly) fail. Verify it reports 522 rules at Biome 2.5.10
- [x] 2.2 Verify the regenerated `audit/rule-metadata.json` differs from its previous state in exactly **one line**, the `biomeVersion` field; `git diff --stat` should report 1 insertion and 1 deletion
- [x] 2.3 Verify `pnpm run check:rule-metadata` now **verifies** rather than skipping, since the target and installed binary agree again

## 3. Record the audit results

- [x] 3.1 Confirm the rule audit is empty against 2.5.10 and record the evidence: the 2.5.9 and 2.5.10 configuration schemas are byte-identical, and the metadata sweep shows 522 rules with no differences in category, severity, recommended status, domains, or example languages. Verify by re-running the sweep and diffing, not by asserting it
- [x] 3.2 Confirm no preset rule list moved — `react-strict` and `react-balanced` still list **262** rules and the `-stable` variants **180**; verify with `pnpm run check:presets`, whose README-inventory invariant also confirms the published counts still match

## 4. Documentation and release

- [x] 4.1 Add a `patch` changeset that separates what the presets changed (the version pin, no rule-list change) from what upgrading Biome hands consumers: the sixteen Astro parser fixes, the Vue same-name-binding fix reaching every preset via the recommended `noUnusedVariables` / `noUnusedImports`, the `useStrictMode` Vue fix, the Svelte parse-crash fix, nine performance improvements to listed rules, and the LSP memory-leak fix. Verify the changeset does not imply any diagnostic change from the rule lists
- [x] 4.2 State in the changeset that consumers with `.astro` files inherit the parser fixes even though the presets exclude Astro *rules*; verify the wording does not claim the presets added Astro support
- [x] 4.3 Record the one release-note claim that did not reproduce — `{#if x}` in a plain `.html` file is clean on both 2.5.9 and 2.5.10 under these presets — so the next pass does not re-test it blind

## 5. Whole-change verification

- [x] 5.1 Run `pnpm run check` end to end and confirm all six checks pass, including `check:presets`' pinned-target invariant now agreeing on 2.5.10 across the snapshot, seven `$schema` URLs, and the README
- [x] 5.2 Confirm no `dist/*.json` rule entry changed: `git diff dist/` should show only `$schema` lines
- [x] 5.3 Confirm `audit/rule-exclusions.json` is untouched — no rule's classification moved
- [x] 5.4 Run `openspec validate upgrade-biome-2-5-10` and confirm the change is valid before archiving
