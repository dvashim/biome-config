## 1. Move the toolchain before the target

- [x] 1.1 Bump the `@biomejs/biome` devDependency to `^2.5.11` and run `pnpm install`. Verify `pnpm exec biome --version` reports 2.5.11 — the metadata sweep refuses to run while the installed binary and the pinned target disagree, so the binary has to move first.
- [x] 1.2 Update the `$schema` URL from `2.5.10` to `2.5.11` in all six `dist/*.json` presets and in the root `biome.json`. Verify `grep -rl 'schemas/2\.5\.10/' dist/ biome.json` returns nothing.
- [x] 1.3 Update the `README.md` version references — the requirements-table `**2.5.10+**`, the `$schema` prose, the `biome.json` examples, and the `@biomejs/biome@^2.5.10` snippet. Verify the historical "in Biome 2.5.0" mentions are **left alone**: they record when rules graduated, not the target.

## 2. Regenerate the rule metadata

- [x] 2.1 Run `pnpm sync-rule-metadata` with no `--biome` override, after 1.1 and 1.2. Verify it reports **524** rules at Biome 2.5.11 (522 + the two additions).
- [x] 2.2 Verify the snapshot diff is exactly the audit: `biomeVersion`, plus entries for `noUndeclaredCustomProperties` and `noAstroSetHtmlDirective`, and nothing else. No rule may change category, severity, recommended status, domains, or example languages — confirm by diffing, not by asserting.

## 3. Reconcile the rule set

- [x] 3.1 Add `noUndeclaredCustomProperties` to `dist/biome.react-strict.json` under `nursery` at `"warn"`, and to `dist/biome.react-balanced.json` under `nursery` at `"info"`. Run `biome check --write` afterwards so the `useSortedKeys` assist places it — string-valued entries sort before object-valued ones within a category.
- [x] 3.2 Confirm `noAstroSetHtmlDirective` is **absent** from every preset and that **no** `audit/rule-exclusions.json` entry is added for it. Verify `pnpm run check:presets` reports 0 unaccounted: the metadata places it out of scope through its `astro`-only domain, and the ledger rejects an entry it already classifies.
- [x] 3.3 Run `pnpm sync-stable` and verify both `-stable` files change **only** in their `$schema` line — the added rule is nursery, so it is stripped and the stable totals stay at 180. Verify `pnpm run check:sync-stable` reports no drift.

## 4. Reconcile the published counts

- [x] 4.1 Update every README count the pass moves: the ladder bullet 262 → 263; the Configurations table's `react-strict` and `react-balanced` rows to 263 and their nursery cells to 83; the balanced row's relaxation count 18 → 19. Leave both `-stable` rows at **180 / 15** — verify that is deliberate, not an oversight, and that `check:presets` agrees.
- [x] 4.2 Update the `nursery (82 rules)` per-category bullet to 83, the `**18 targeted relaxations**` phrase to 19, and the `of the 18 relaxations` phrase to 19. Leave `those 15 apply in` and `with the 15 stable-category relaxations` at 15. Verify `pnpm run check:presets` passes, which reconciles all of them at once.
- [x] 4.3 Add a row to the README's balanced relaxation table for `noUndeclaredCustomProperties`, stating that resolution is per-file and the rule publishes no option. Verify the rule name it introduces exists in `react-strict` — the README-inventory invariant checks every rule the README names.
- [x] 4.4 Update `CLAUDE.md`: the nursery-relaxation sentence now names **four** rules, not three, and its `18` becomes 19. Verify by grep — nothing checks this file, which is why it is its own task rather than folded into 4.2.

## 5. Record the upstream behavior audit

- [x] 5.1 Read the 2.5.11 release notes and record the fixes to **recommended** rules — three to `noUnusedVariables` (Vue `v-bind()` in CSS, TypeScript generic parameters on function overloads, Vue custom directives), one to `noGlobalAssign`, one to `useValidAnchor`. Verify each is recommended and domain-free in the regenerated snapshot, and therefore reaches all six presets including both `-stable` variants.
- [x] 5.2 Record the changes that reach files rather than rules: the Astro parser fixes, the Vue interpolation formatter change, the markdown formatting idempotency fix, and `--stdin-file-path` honouring full HTML support — which these presets enable via `html.experimentalFullSupportEnabled`. Verify that flag is set in all six presets before claiming consumers are affected.
- [x] 5.3 Re-run the analysis-scope fixture from `proposal.md` against the installed 2.5.11 and confirm the table still holds before the changeset repeats its claims. Do not carry the verdict forward on the strength of this document.

## 6. Release and verification

- [x] 6.1 Create a **minor** changeset — a preset rule list changes. Lead with the recommended-rule fixes that reach every preset, then the new rule and why balanced turns it off, then the asymmetry: strict/balanced 262 → 263, both `-stable` unchanged at 180.
- [x] 6.2 Run `pnpm run check` end to end and confirm all six checks pass, including the pinned-target invariant agreeing on 2.5.11 across the snapshot, seven `$schema` URLs, and the README.
- [x] 6.3 Confirm the only `dist/*.json` rule-entry change is the one added rule: `git diff dist/` should show `$schema` lines plus a single `noUndeclaredCustomProperties` entry in each of strict and balanced.
- [x] 6.4 Run `openspec validate upgrade-biome-2-5-11 --strict` and confirm the change is valid before archiving.
