# Intent

## Source intent

`docs/intents/0001-keep-presets-current.md` — keep the presets carrying the related
rules of every new linter release.

## Slice

This change delivers the shared intent's Outcome for one release: **Biome 2.6.2**,
the newest release on npm since 2026-10-21. The presets name 2.5.15. Everything
2.6.2 changes arrived in 2.6.0, published the same morning; 2.6.1 and 2.6.2 republish
the same code after two failed publishing attempts.

- **This change: the rules 2.6 brings.** 2.6 adds 50 rules and renames one.
  Twenty-seven relate to the presets' groups — JavaScript and TypeScript, testing,
  and Tailwind — and no preset carries them, so a team that wants them has to add
  them to its own config today. The other 23 serve only Vue or Svelte, which the
  presets leave out, or Markdown and YAML, which the package has never covered.
  2.6 also promotes 59 experimental rules to stable groups; the presets carry 50 of
  them. Once this change lands, the update that moves the package to 2.6.2 carries
  the 27, keeps every promoted and renamed rule the presets carry at the level the
  presets gave it, and records why the 23 are left out: the shared intent's success
  signal, read for this release.
- **Carried with it, because this release makes it necessary.**
  - **No preset loads under 2.6.** 2.6 rejects a setting all six presets carry, and
    every promoted rule still listed under its old group. A team on the current
    package that installs Biome as the README says — its version range already
    resolves to 2.6.2 — gets a configuration error before anything is checked. Until
    this update ships, the presets reach no team on the new release at all.
  - **2.6 starts formatting Markdown, YAML, and SCSS files** that 2.5.15 never
    touched, and its default Markdown handling rewrites the block of settings at the
    top of a Markdown file — the block Changesets reads its release notes from —
    whenever a team applies Biome's fixes, which the README tells teams to do. The
    update keeps that block intact, so following the README does not damage a team's
    files, and it tells teams everything else 2.6 changes for them.
  - **The repository's own checks** reject its configuration under 2.6, misread the
    examples of the new Markdown rules, and would rewrite files that are records or
    generated output. The update corrects them, so they keep holding every later
    update to the shared intent's success signal.
  - **What is written down** — the README's version guidance, counts, named rules,
    and settings table, and the maintainer guidance — is corrected wherever 2.6 makes
    it untrue.
- **Left to other changes.** Each later release's own update. The dependency and
  tooling updates sitting uncommitted beside this work — the package manager, other
  development dependencies, the OpenSpec CLI and the files it regenerates — serve
  other work, not this intent.
- **Not taken up here.**
  - The shared intent's open questions stay open: where the success signal is checked
    beyond the repository's own checks, how soon a new release must be taken up, and
    a target for team configs. This release is evidence for the second: for as long
    as the update waits, a team that installs the current Biome cannot use the
    presets at all.
  - Whether the presets should start covering Markdown or YAML. The shared intent
    leaves out groups the package does not ship; taking these on needs a new intent.

## Approval

Approval is held by the shared intent; this slice records no approval of its own.

- **Originator**: Aleksei, owner of the shared config package
- **Approver**: Aleksei, owner of the shared config package
- **Accepted on**: 23.10.2026, as recorded in the shared intent
- **Supersedes**: none
