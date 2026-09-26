# Intent

## Source intent

`docs/intents/0001-keep-presets-current.md` — keep the presets carrying the related
rules of every new linter release.

## Slice

The shared intent's Outcome has two halves. The first is already delivered; this
change delivers the second, as far as the repository itself can guarantee it.

- **Already delivered: the release that was out when the intent was written.**
  That release is Biome 2.5.14. The archived `upgrade-biome-2-5-14` change brought
  its rules into the presets, and the package shipped them as 1.19.0 on 2026-09-26.
  On 2026-09-26 Biome 2.5.14 is still the newest release, and the repository's
  checks find none of its 546 rules unaccounted for. No release is waiting for its
  rules.
- **This change: "each new linter release from now on".** The repository's
  automated checks run on every update of the package before it is published, and
  every later update will rely on them to catch a rule it leaves behind. Today they
  can report that an update carries its release's related rules when it does not:
  - They treat a new experimental rule that Biome labels "recommended" as one the
    presets already turn on. Biome's recommended set never turns on experimental
    rules, so no preset carries such a rule unless it is listed. Three of the six
    rules the last release brought into the presets were of this kind, and the
    checks would have passed with all three missing.
  - They confirm that the list of rules they check against really belongs to the
    release the presets name only when the linter installed in the repository is
    that same release. Otherwise they skip the confirmation and pass, so an update
    that names a new release while still checking against the previous release's
    list passes.
  - Their list leaves out any rule in a rule group a later release introduces, so
    such a release would pass without any of that group's rules.

  Once this change lands, an update that moves the package to a new release cannot
  pass these checks unless that release's related rules are in the presets.
- **Left to other changes.** Each future release's own update — one change per
  release, each a slice of the shared intent.
- **Not taken up here.** The shared intent's open questions stay open: where the
  success signal is checked beyond the repository's own checks (the changelog
  suggestion), how soon a new release must be taken up, and a target for team
  configs. None of them has to be answered to close these gaps.

## Approval

Approval is held by the shared intent; this slice records no approval of its own.

- **Originator**: Aleksei, owner of the shared config package
- **Approver**: Aleksei, owner of the shared config package
- **Accepted on**: not recorded in the shared intent
- **Supersedes**: none
