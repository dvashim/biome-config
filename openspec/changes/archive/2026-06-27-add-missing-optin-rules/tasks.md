## 1. Bump schema and confirm tooling

- [x] 1.1 Update `$schema` from `2.4.16` to `2.5.1` in all six `dist/*.json` files.
- [x] 1.2 Confirm `package.json` (`^2.5.1`), `biome.json` (`$schema` 2.5.1), `pnpm-lock.yaml`, and `README.md` are already at 2.5.1 (not reverted); fix any stale rule-count references in `README.md`.

## 2. Migrate renamed / removed rules (2.4.16 → 2.5.1)

- [x] 2.1 Rename, preserving each preset's severity: `noMultiStr` → `noMultilineString`, `useFind` → `useArrayFind`, `useSpread` → `useSpreadOverApply`.
- [x] 2.2 Confirm the 3 rename mappings against the Biome 2.5.0/2.5.1 changelog; if any is actually a removal, drop it instead.
- [x] 2.3 Drop `noFloatingClasses` (removed in 2.5.1, no successor).

## 3. Relocate the 32 graduated nursery rules to their 2.5.1 categories (preserve severity, per variant)

- [x] 3.1 → a11y (1): `noAmbiguousAnchorText`
- [x] 3.2 → complexity (3): `noDivRegex`, `noRedundantDefaultExport`, `noUselessReturn`
- [x] 3.3 → correctness (2): `noDuplicateAttributes`, `noDuplicateEnumValueNames`
- [x] 3.4 → performance (2): `noJsxPropsBind`, `noSyncScripts`
- [x] 3.5 → security (1): `noScriptUrl`
- [x] 3.6 → style (11): `noContinue`, `noExcessiveClassesPerFile`, `noExcessiveLinesPerFile`, `noIncrementDecrement`, `noMultiAssign`, `noTernary`, `useConsistentEnumValueType`, `useConsistentMethodSignatures`, `useDestructuring`, `useErrorCause`, `useGlobalThis`
- [x] 3.7 → suspicious (12): `noDuplicatedSpreadProps`, `noEqualsToNull`, `noForIn`, `noLeakedRender`, `noNestedPromises`, `noParametersOnlyUsedInRecursion`, `noReturnAssign`, `noShadow`, `noUndeclaredEnvVars`, `noUnknownAttribute`, `noUnnecessaryConditions`, `useArraySortCompare`
- [x] 3.8 Drop the 2 graduated rules that became recommended-stable at default severity: `noDuplicateEnumValues`, `noProto` (redundant via `recommended: true`).

## 4. Add the 41 in-scope opt-in rules to `dist/biome.react-strict.json` (severity `warn`)

- [x] 4.1 a11y (1): `noNoninteractiveElementInteractions`
- [x] 4.2 correctness (11): `noBeforeInteractiveScriptOutsideDocument`, `noChildrenProp`, `noNextAsyncClientComponent`, `noPrivateImports`, `noRenderReturnValue`, `noRestrictedElements`, `noUnusedInstantiation`, `useExhaustiveDependencies`, `useHookAtTopLevel`, `useInlineScriptId`, `useJsxKeyInIterable`
- [x] 4.3 nursery (9): `noReactNativeDeepImports`, `noReactNativeLiteralColors`, `noReactNativeRawText`, `noRestrictedDependencies`, `noUndeclaredClasses`, `noUnusedClasses`, `useIncludes`, `useReactFunctionComponentDefinition`, `useReactNativePlatformComponents`
- [x] 4.4 performance (3): `noImgElement`, `noUnwantedPolyfillio`, `useGoogleFontPreconnect`
- [x] 4.5 security (2): `noDangerouslySetInnerHtml`, `noDangerouslySetInnerHtmlWithChildren`
- [x] 4.6 style (7): `noHeadElement`, `noHexColors`, `noRestrictedGlobals`, `noRestrictedImports`, `noRestrictedTypes`, `noValueAtRule`, `useNodeAssertStrict`
- [x] 4.7 suspicious (8): `noArrayIndexKey`, `noDocumentImportInPage`, `noDuplicateTestHooks`, `noExportsInTest`, `noFocusedTests`, `noHeadImportInDocument`, `useDeprecatedDate`, `useRequiredScripts`
- [x] 4.8 Insert each as a simple `"warn"` string, alphabetically within its category and **before** any object-valued rules (`groupByNesting` / `useSortedKeys`). (9 Next.js + 4 React Native rules are among the above.)

## 5. Mirror into `dist/biome.react-balanced.json` with relaxations

- [x] 5.1 Apply the same migration (§2–3) and the same 41 additions (§4).
- [x] 5.2 Relax in `react-balanced`: broadly-firing framework rules (notably `noImgElement` → `off`/`info`) and the usual stylistic / high-noise additions; keep correctness, security, and React-correctness additions at `warn`. Preserve any relaxed severities carried over from relocated nursery rules.

## 6. Resolve option-required rules

- [x] 6.1 For `noRestrictedGlobals`, `noRestrictedImports`, `noRestrictedTypes`, `noRestrictedElements`, `noRestrictedDependencies`: add bare at `warn` (no-op until options supplied) or defer per the design Open Question; record the choice in the changeset.

## 7. Normalize, regenerate, and verify

- [x] 7.1 Run `biome format --write` to normalize key ordering in both edited files.
- [x] 7.2 Run `pnpm sync-stable` to regenerate the `-stable` variants (now including the 32 relocated rules; do not hand-edit).
- [x] 7.3 Run `pnpm check` and confirm it passes against the 2.5.1 binary with no drift; resolve any further deprecated/removed rules it surfaces.
- [x] 7.4 Confirm each preset now lists **253** rules (214 migrated − 2 + 41) and each `-stable` variant equals its parent minus nursery.

## 8. Changeset

- [x] 8.1 Run `pnpm changeset` (**minor** — Biome 2.5.1 upgrade + new diagnostics) describing the version bump, graduations/renames/removal, the 41 additions (incl. Next.js / React Native), and the 2 removals. The changeset auto-commits (`"commit": true`).
