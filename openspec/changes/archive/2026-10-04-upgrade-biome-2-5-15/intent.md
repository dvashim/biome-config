# Intent

## Source intent

`docs/intents/0001-keep-presets-current.md` — keep the presets carrying the related
rules of every new linter release.

## Slice

This change delivers the shared intent's Outcome for one release: **Biome 2.5.15**,
published on 2026-09-30 and still the newest release on npm on 2026-10-04. The
presets name 2.5.14.

- **This change: the rules 2.5.15 brings.** 2.5.15 adds 11 rules. Eight relate to
  the presets' groups — JavaScript and TypeScript, CSS, HTML and JSX, React, and
  Tailwind — and no preset carries them, so a team that wants them has to add them
  to its own config today. The other three serve only Astro or Svelte, which the
  presets leave out. Once this change lands, the update that moves the package to
  2.5.15 carries the eight in the strict and balanced presets and records why the
  three are left out: the shared intent's success signal, read for this release.
- **Carried with it, because this release makes it necessary.** 2.5.15 also changes
  what some rules the presets already carry report, and how Biome treats some teams'
  own settings. One rule the presets already enable now reaches projects it used to
  skip, and the package's README tells teams the opposite. Two kinds of change a
  team may have made on top of a preset stop working. The same update tells teams
  what changes for them, corrects that README statement and every rule count the
  README publishes, and corrects the maintainer guidance this release makes untrue,
  so the next release's update starts from accurate guidance.
- **Left to other changes.** Each later release's own update. The dependency and
  tooling updates sitting uncommitted in the repository beside this work — the
  package manager, other development dependencies, the OpenSpec CLI — serve other
  work, not this intent.
- **Not taken up here.** The shared intent's open questions stay open: where the
  success signal is checked beyond the repository's own checks, how soon a new
  release must be taken up, and a target for team configs. None has to be answered
  to deliver this release.

## Approval

Approval is held by the shared intent; this slice records no approval of its own.

- **Originator**: Aleksei, owner of the shared config package
- **Approver**: Aleksei, owner of the shared config package
- **Accepted on**: not recorded in the shared intent
- **Supersedes**: none
