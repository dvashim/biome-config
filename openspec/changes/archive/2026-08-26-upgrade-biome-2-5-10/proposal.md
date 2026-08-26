# Proposal: upgrade-biome-2-5-10

> Scope note: the recurring version-tracking pass. npm `latest` for
> `@biomejs/biome` is **2.5.10** and the installed range is already `^2.5.10` — a
> committed `pnpm up` moved it — while the presets pin and document **2.5.9**.
> This is the split state the standing requirement is keyed on. The pass audits
> the same four things as always and records each outcome; three of them are
> empty by construction this time, which is itself the finding.

## Why

The presets carry a standing obligation to target the latest stable Biome
release. Biome shipped 2.5.10, the dependency range already moved with a
dev-dependency sweep, but the consumer-facing surface still says 2.5.9 in
fourteen places.

What makes this pass unusual: **2.5.10 changes nothing a schema or metadata diff
can see.** The published configuration schemas for 2.5.9 and 2.5.10 are
byte-identical (sha256 `97ff207f1828`, confirmed against the installed package's
own `configuration_schema.json`), and a full rule-metadata sweep of both versions
shows **522 rules with zero differences** in category, default severity,
recommended status, domains, or example languages. Every rule audit this pass
would run therefore returns empty before it starts, and the release notes are the
only source of consumer impact — which is exactly the case the
`Upstream behavior changes are audited from the release notes` requirement was
added for.

## What Changes

- **Advance the pinned target 2.5.9 → 2.5.10** — the `$schema` URL in all six
  `dist/*.json` presets and in `biome.json` (seven files), and the **seven**
  version references in `README.md`. The `@biomejs/biome` range is already
  `^2.5.10`; this change adopts it rather than re-doing it.
- **Regenerate `audit/rule-metadata.json`** so the snapshot describes the version
  the presets target. Because the metadata is identical between the two releases,
  the regenerated file differs in exactly **one line** — its `biomeVersion`
  field. Once regenerated, the installed binary and the pinned target agree again
  and `check:rule-metadata` resumes verifying snapshot drift instead of skipping.
- **No rule-list change.** No rule was added, removed, renamed, or graduated, and
  no rule gained an option. `react-strict` and `react-balanced` stay at **262**
  listed rules and the `-stable` variants at **180**; `pnpm sync-stable` produces
  no change beyond the `$schema` line.
- **Rule audit against 2.5.10 — empty, measured rather than assumed.** The
  schema rule-key diff is empty because the schemas are byte-identical, and the
  metadata sweep confirms nothing moved that a schema cannot express — no
  severity flip, no recommended-status change, no domain change. Coverage stays
  at zero unaccounted rules.
- **Behavior-change audit — 27 patch entries, and the shape is lopsided.** No
  formatter change, and no rule reports *more* than it did. By reach:
  - **Sixteen Astro parser fixes**, the dominant theme of the release: an
    expression holding only a comment no longer fails to parse (which also
    stopped the whole file from being formatted), a bare `<` in text is text,
    `{}` is empty, fragment shorthand is supported, frontmatter is no longer cut
    short by `</script>` inside a string or by a line starting with a dash,
    `is:raw` children are raw text, `:href`-style attributes parse, `{` inside
    `<math>` is literal, `{{` opens an object literal rather than an
    interpolation, `<pre>`/`<textarea>` contents are parsed as markup, template
    literal attribute values work, and HTML5 unquoted attribute values
    containing `` ` ``, `=`, `'` or `"` are accepted.
  - **Two Vue false-positive fixes**, one of which reaches every preset:
    variables and imports used by same-name bindings (`:disabled`) are no longer
    reported unused — that is `noUnusedVariables` / `noUnusedImports`, both
    recommended and therefore active in all six presets. The other is
    `useStrictMode` (listed, `warn`) no longer reporting `@click="count++"`.
  - **One Svelte parse crash** on incomplete `{let}` / `{const}` declarations.
  - **One HTML-family parse fix** — `{#`, `{/`, `{:`, `{@` are Svelte-only again,
    so `{#if x}` in an HTML, Vue, or Angular file is text rather than a parse
    error. **This did not reproduce** for a plain `.html` file under these
    presets; it is recorded as unverified rather than claimed.
  - **Nine performance improvements to listed rules** — `noFloatingPromises`
    (nursery, `warn`) stops doing needless type inference on call arguments of
    non-generic `new` instances, and eight test-domain rules got faster
    (`useNamedCaptureGroup`, `noMisplacedAssertion`, `noSkippedTests`,
    `noExportsInTest`, `noDuplicateTestHooks`, `noIdenticalTestTitle`,
    `useTestHooksInOrder`, `useTestHooksOnTop`). All eight are listed. No
    diagnostic changes.
  - **An LSP memory leak** that grew over long editor sessions — no config
    surface, but every consumer's editor.
  - **Two that reach nothing here** — GritQL metavariables in quoted strings, and
    extra `@eslint/css` rule sources for `biome migrate eslint`.
- **The Astro fixes do reach consumers, and that is not a contradiction.**
  Measured, not inferred: a fixture extending `react-strict` reports
  "Checked 2 files" for one `.astro` and one `.html` file, because the react
  presets set `files.includes: ["**", …]` and all six enable
  `html.experimentalFullSupportEnabled`. The same `.astro` fixture produces
  **2 parse errors on 2.5.9 and 0 on 2.5.10**. The presets exclude Astro *rules*
  as out of scope — the README says so — but that exclusion has never applied to
  *file types*, and Astro with React islands is an ordinary setup.
- **Add a changeset (`patch`).** The `$schema` target advances and no preset rule
  list changes, which the standing requirement pins as the `patch` case.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `linter-rule-coverage`: **two modified requirements**.
  - *Presets track the latest stable Biome release* (MODIFIED) — it enumerates
    what a pass advances when the target lags: the `$schema` URLs, the dependency
    range, and the re-derived rule set. The rule-metadata snapshot introduced by
    `mechanize-rule-audit` is not in that list, even though the snapshot is
    defined as describing the version the presets target. A pass that forgot it
    would be caught by the pinned-target invariant, but the requirement
    describing the pass is incomplete. The snapshot is added to what advances.
  - *Out-of-scope rules are excluded* (MODIFIED) — the requirement excludes
    framework rules from the presets' rule lists, and the README states the same.
    Neither says anything about *file types*, and this release makes the gap
    concrete: its largest cluster by far is Astro parser work, which reaches any
    consumer with `.astro` files because the presets lint every file Biome can
    parse. A scenario records that excluding a framework's rules is not a claim
    about which files the presets process, so a release like this one is
    disclosed rather than dismissed as out of scope.

## Impact

- **Published package** (triggers a `patch` release): the `$schema` line in all
  six `dist/*.json` presets and every version reference in `README.md`. **No
  consumer's diagnostics change from the rule lists** — they do not move. What
  consumers do inherit by upgrading Biome: the Astro parser fixes if they have
  `.astro` files, the Vue unused-binding fix through the recommended rules active
  in every preset, faster test-domain and promise rules, and the LSP memory fix.
- **Root config**: `biome.json` `$schema`.
- **Audit data**: `audit/rule-metadata.json` regenerated at 2.5.10 — a one-line
  diff, and the event that re-arms `check:rule-metadata`.
- **Specs**: `linter-rule-coverage`, two requirements modified.
- **Not touched**: every preset rule list, the `-stable` derivation beyond its
  `$schema` line, the exclusion ledger, the balanced relaxation table, Node
  `engines`, `.node-version`, and the CI workflows.
