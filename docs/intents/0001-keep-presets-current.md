# Intent

## Problem

The shared config package ships ready-to-use config presets, organized in groups. Teams include the presets in their own configs and add or override rules on top. When a new linter release adds rules related to a preset's groups, the presets don't carry them, so every team that wants those rules has to add them to its own config. This repeats with each release, and a release is out now whose related rules the presets don't carry yet.

## Who is affected

- Teams that include the presets in their own configs.

## Outcome

Teams that include a preset get the rules related to its groups from the preset itself, with nothing added to their own configs. This holds for each new linter release from now on, not only the current one.

## Success signal

Every update of the shared config package that moves it to a new linter release brings that release's related rules into the presets in the same update.

## Constraints

None. Considered with the originator, none apply: keeping teams' own additions and overrides working, updates starting to fail teams' checks, security or compliance review of new versions, lint run time, deadlines, and dependencies on other teams.

## Non-goals

- Rules for groups the package doesn't ship today.
- Cleaning up teams' own rule additions once the presets carry those rules.

## Open questions

- The request named updating the npm package, syncing the shared configs with the new version, and updating the rules related to the configs. Confirm this covers the need, including future releases.
- Where the success signal is checked. Suggestion, not confirmed: each package release's changelog, compared against the release notes of the linter version it moves to.
- A target for how many team configs still add rules that belong to a preset's groups: not set.
- How soon after a new linter release the package itself should be updated: not set.

## Approval

- **Status**: accepted
- **Originator**: Aleksei, owner of the shared config package
- **Approver**: Aleksei, owner of the shared config package
- **Accepted on**:
- **Supersedes**: none
