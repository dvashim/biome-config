# 0002. Keep Biome's defaults for new settings unless a default damages files

Status: accepted
Date: 2026-10-23
Supersedes: none

## Context

The presets set formatter, parser, and assist defaults in a block all six share
byte for byte, and Biome adds configuration settings with its releases. The
standing `linter-rule-coverage` requirement "New rule options are adopted only to
override an upstream default" governs options on the rules the presets list: they
inherit Biome's default unless their intent differs, so they never freeze a value
that merely restates it. Nothing says how a pass treats a new setting outside the
rules.

Biome 2.6 added three such sections — `markdown`, `yaml`, and `tailwind` — and
began formatting and linting Markdown and YAML files by default. Its default
`markdown.parser.frontmatter: false` reads the front matter that opens a Markdown
file as a thematic break followed by prose. Measured with `biome format --write`, a
Changesets file's front matter becomes a `##` heading, and nested front-matter keys
lose their indentation. The README tells teams to run `biome check --write`. The
other new settings' defaults are either the ecosystem's own (the Tailwind function
lists) or harmless.

Intent: `docs/intents/0001-keep-presets-current.md`, sliced by the change
`upgrade-biome-2-6-2` (under `openspec/changes/`, then `archive/` once it is
archived), whose `design.md` decisions 9 and 10 record the measurements.

## Decision

When a Biome release adds a configuration setting outside the rule options, the
presets keep Biome's default. They set the setting only where its default damages
files the presets have Biome process, under the workflow the README documents —
never to restate a default, and never to tune output to taste. Such a setting goes
in the block all six presets share, and the README's Defaults section names it.

`markdown.parser.frontmatter: true`, for Biome 2.6, is the first such setting.

## Consequences

- **Easier.** Every pass audits new settings against one test, and the presets stay
  close to Biome's own behaviour, which each changeset discloses rather than masks.
- **Harder.** A protective setting couples every preset — the two recommended ones
  included — to the Biome release that introduced it, and it diverges from Biome's
  default until Biome changes that default.
- **Future changes must:**
  - audit every setting a release adds outside the rule options, and record the
    outcome for each, as the standing requirement does for rule options;
  - remove a protective setting once Biome's default matches it;
  - supersede this ADR to set a new setting on any other ground, such as style or
    preference.
