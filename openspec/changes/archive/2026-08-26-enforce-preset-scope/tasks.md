## 1. Remove the two out-of-scope rules

- [x] 1.1 Remove `noDuplicateEnumValueNames` (correctness) and `useDeprecatedDate` (suspicious) from `dist/biome.react-strict.json` and `dist/biome.react-balanced.json`; verify each preset lists **262** rules, with correctness at **24** and suspicious at **41**
- [x] 1.2 Run `pnpm sync-stable` and verify both `-stable` variants list **180** rules and `pnpm run check:sync-stable` reports no drift
- [x] 1.3 Run `biome check --write` over the edited `dist/*.json` files and verify `pnpm run check:format` passes — key order is not checked by `check:format`, so the assist must be applied deliberately

## 2. README reconciliation

- [x] 2.1 Update the four counts — `correctness` 25 → 24, `suspicious` 42 → 41, the strict total 264 → 262, and both `-stable` totals 182 → 180 (two separate lines); verify `pnpm run check:presets` reports no README-inventory problem
- [x] 2.2 Remove the two prose mentions — "duplicate enum member names (`noDuplicateEnumValueNames`)" from the correctness bullet and `useDeprecatedDate` from the suspicious bullet; verify the README names no rule the presets no longer list
- [x] 2.3 Confirm the relaxation table and its 18 / 15 figures are untouched, since neither removed rule is relaxed; verify by diffing the table section

## 3. Ledger gains a direction

- [x] 3.1 Reshape `audit/rule-exclusions.json` entries from `"<rule>": "<reason>"` to `"<rule>": { "direction": "in" | "out", "reason": "…" }`; verify the file parses and every entry carries both fields
- [x] 3.2 Add the `noRestrictedTypes` entry with direction `in` and a reason naming why it is underivable (its only fenced block is its own options sample, so it publishes no example language); verify `pnpm run check:presets` accepts it
- [x] 3.3 Update the ledger's `$comment` to describe both directions, since it currently states the empty ledger is the expected state; verify the text matches the reshaped file

## 4. The scope invariant

- [x] 4.1 Add the eighth invariant to `scripts/check-presets.ts`: a listed rule is in scope when it targets a covered language **or** belongs to an in-scope domain, and is out of scope only when **every** published language is excluded or **every** declared domain is an excluded framework domain. Verify it reports zero against the corrected presets
- [x] 4.2 Verify the all-or-nothing domain reading. **No live rule exercises it** — the two mixed-domain rules `useJsxKeyInIterable` (`[qwik, react]`) and `noDuplicatedSpreadProps` (`[react, solid]`) publish `jsx` examples, so the language clause covers them either way, and none of the 48 rules lacking an in-scope language has mixed domains. Verify instead against a synthetic rule with domains `[react, vue]` and language `vue`: `some` keeps it in scope, `every` wrongly flags it
- [x] 4.3 Verify the disjunction is load-bearing: dropping the language half flags **201** listed rules in `react-strict` alone (680 across all four presets) — 168 with no domain at all, plus the 33 in unnamed domains (`types` 17, `playwright` 11, `drizzle` 2, `tailwind` 2, `turborepo` 1). With both halves, none is flagged
- [x] 4.4 Verify the invariant fires: re-add `useDeprecatedDate` and confirm it is flagged; re-add `noDuplicateEnumValueNames` and confirm the same; remove the `noRestrictedTypes` ledger entry and confirm it is flagged. Restore after each, and confirm the working tree is unchanged
- [x] 4.5 Update `CLAUDE.md`'s `audit/` section — it lists seven invariants and describes the ledger as empty and single-directional; verify both statements match the shipped behaviour

## 5. Release

- [x] 5.1 Create a `minor` changeset naming both removed rules; verify it states the asymmetry explicitly — `useDeprecatedDate` switches **off**, while `noDuplicateEnumValueNames` stays active and moves from `warn` to Biome's default `error`, and only consumers who lint `.graphql` files see either
- [x] 5.2 Confirm the changeset does **not** claim a Biome version change; the pinned target stays 2.5.9 and `audit/rule-metadata.json` is not regenerated

## 6. Whole-change verification

- [x] 6.1 Run `pnpm run check` end to end and confirm every check passes, including `check:presets` with the new invariant
- [x] 6.2 Confirm `audit/rule-metadata.json` is byte-identical to its state before this change; verify with `git diff --stat audit/rule-metadata.json` reporting no changes
- [x] 6.3 Confirm `dist/biome.recommended.json` and `dist/biome.react-recommended.json` are untouched; verify with `git diff --stat`
- [x] 6.4 Run `openspec validate enforce-preset-scope` and confirm the change is valid before archiving
