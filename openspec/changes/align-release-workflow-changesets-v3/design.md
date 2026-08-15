## Context

See `proposal.md` — Why. The constraints that shape the approach:

- This is a **single-package** repo (no `pnpm-workspace.yaml`), so `@manypkg/get-packages` reports `tool: "root"`. That selects the root branch of `changesets/action@v1.9.0`'s publish handler ([`src/run.ts:137`](https://github.com/changesets/action/blob/v1.9.0/src/run.ts#L137)), which needs a `New tag:` line in `changeset publish` stdout to push the `v<version>` tag and cut the GitHub release. Existing releases follow the `v1.13.0` tag convention, confirming that branch is the live one.
- `@changesets/cli@3.0.0` emits no `New tag:` string anywhere in its `dist/`; it reports published packages through the file named by `CHANGESETS_OUTPUT`.
- The release path cannot be exercised on a branch. `Release` only triggers on push to `main`, and its consequences (npm publish, tag push, GitHub release) are one-way. Correctness has to come from static verification plus the upstream contract, not a rehearsal.
- npm auth is trusted publishing (`id-token: write` + `NPM_CONFIG_PROVENANCE: true`, no `NPM_TOKEN`).

## Goals / Non-Goals

**Goals:**

- The next push to `main` produces the same observable artifacts as v1.13.0 did: an npm publish with provenance, a `v<version>` git tag, and a GitHub release.
- Every changesets-adjacent file states a version consistent with what the lockfile resolves.

**Non-Goals:**

- Restructuring the release job into `changesets/action/version` + `changesets/action/publish` sub-actions. v2's README recommends this to narrow where `id-token: write` is exposed, but it is a larger workflow rewrite than this change needs and is better proposed on its own merits.
- Adopting any newly available v2 capability (`pr-status` changeset comments on PRs, `pr-draft`, `pack`).
- Touching `.github/workflows/check.yml`, which runs no Changesets tooling.

## Decisions

**Pin `changesets/action` at v2.1.0 by commit SHA (`198f833dd7d863100ea6e28967bc9a9fdefadb0a`), not a floating tag.**
Every other action in both workflows is SHA-pinned with a `# vX.Y.Z` trailing comment; this follows that convention. It is also forced: the repo publishes no floating `v2` ref (`git/ref/tags/v2` → 404), so a major-only pin is not available. v2.1.0 over v2.0.0 because v2.1.0 restores the `cwd` input that v2.0.0 removed by mistake and fixes a `pr-status` link — no behavior this repo depends on regresses between them.

**Take v2's default push mode (GitHub API) rather than setting `push-with-git-cli: true`.**
The v1-equivalent behavior is available, but the new default is strictly better here: commits and tags are signed with GitHub's GPG key and attributed to the token owner. Nothing in this repo depends on the release commit being authored by a local git identity, which is also why dropping `setupGitUser` is safe — v2 configures `github-actions[bot]` as the fallback identity itself.

**Drop the `GITHUB_TOKEN` env var instead of moving it to the `github-token` input.**
v2 no longer reads the env var, and the input already defaults to the GitHub-provided token. Since the workflow passes exactly `secrets.GITHUB_TOKEN` — the default — an explicit input would be redundant. `NPM_CONFIG_PROVENANCE: true` stays in `env`; it configures npm, not the action.

**Leave `publish-script: pnpm changeset publish` as-is despite v2's `CHANGESETS_OUTPUT` handoff.**
v2 release note #678 warns that custom scripts must pass `CHANGESETS_OUTPUT` down to the CLI. `pnpm changeset publish` inherits the process environment, so the variable the action sets reaches the CLI without an explicit forward. No script change is needed — but this is the single assumption that, if wrong, reproduces the exact failure this change exists to fix, so the task list verifies it against the action's v2 source rather than trusting the reasoning.

**Bump the `.changeset/config.json` `$schema` URL without migrating any keys.**
Checked against the installed `@changesets/config@4.0.0` schema: `baseBranch`, `access`, `commit`, `fixed`, `ignore`, `linked`, `updateInternalDependencies`, and `changelog` all remain valid properties. `prettier` was removed in favor of `format`, but this config never set it. `disableThanks` is still honored by `@changesets/changelog-github@1.0.0`.

**Ship with no changeset.**
Per the repo's sizing rule, nothing under `dist/` or in `README.md` changes, so there is no published impact to version.

## Risks / Trade-offs

**The fix is only provable on the next release to `main`.** → Mitigated by verifying statically before merge: confirm the action's v2 source reads the output file rather than stdout, and confirm `actionlint`-level input names against v2's `action.yml` rather than its README prose. After the first post-merge release, confirm the tag and GitHub release exist before considering the change settled.

**v2 changes how the version PR is created (GitHub API push), which could interact with repo settings.** → The `Allow GitHub Actions to create and approve pull requests` org/repo setting must be enabled; it already is, since v1 has been opening version PRs. Permissions (`contents: write`, `pull-requests: write`, `id-token: write`) are unchanged and already sufficient per v2's documented requirements.

**Rollback is not symmetric.** → Reverting to v1.9.0 restores a configuration that is known-broken against CLI v3; the real rollback for a v2 failure is to fix forward, or to revert the CLI to v2 as well. Worth knowing before the release rather than during it.

**A silent failure recurs if a future Changesets major again splits the action.** → The spec requirement added by this change makes reconciling integration points part of the upgrade contract, so the next major is checked rather than assumed.
