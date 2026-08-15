## 1. Verify assumptions against the action's v2 source

- [x] 1.1 Confirm `changesets/action@v2.1.0` detects published packages from the `CHANGESETS_OUTPUT` file rather than stdout, and that it sets that variable for the publish script itself (so `pnpm changeset publish` needs no explicit forward) — read the v2.1.0 source, not the README
- [x] 1.2 Confirm the exact input names against v2.1.0's `action.yml`: `version-script`, `publish-script`, `github-token`, `push-with-git-cli`, `push-git-tags`, `create-github-releases` — and confirm `setupGitUser`/`setup-git-user` no longer exists
- [x] 1.3 Confirm `create-github-releases` and `push-git-tags` default to producing both a git tag and a GitHub release when neither is set, matching the `v1.13.0` release convention
- [x] 1.4 Re-resolve the v2.1.0 annotated tag to its commit SHA and confirm it is `198f833dd7d863100ea6e28967bc9a9fdefadb0a`
- [x] 1.5 Re-confirm the non-issues recorded in `proposal.md` — Impact still hold against v2's flow, in particular that v2's `select-mode` step runs the version script only when changesets exist (so CLI v3's new "exit 1 with no changesets" behavior stays unreachable), and that v2's publish path leaves trusted publishing working without an `NPM_TOKEN`; correct the proposal if any no-edit finding turns out to be wrong

## 2. Migrate the release workflow

- [x] 2.1 In `.github/workflows/release.yml`, replace `changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0` with the v2.1.0 SHA pin and its `# v2.1.0` comment
- [x] 2.2 Rename the step inputs: `version:` → `version-script:`, `publish:` → `publish-script:`; delete `setupGitUser: true`
- [x] 2.3 Delete `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` from the step's `env`, keeping `NPM_CONFIG_PROVENANCE: true`
- [x] 2.4 Leave the job's `permissions` block unchanged and confirm `contents: write`, `pull-requests: write`, and `id-token: write` still satisfy v2's documented requirements

## 3. Align the Changesets config

- [x] 3.1 Update `$schema` in `.changeset/config.json` from `@changesets/config@3.1.2/schema.json` to `@changesets/config@4.0.0/schema.json`
- [x] 3.2 Validate the config against the installed v4 schema — every existing key resolves, and no removed key (notably `prettier`) is present

## 4. Correct the documentation

- [x] 4.1 Remove the `node-fetch@2` / `ERR_STREAM_PREMATURE_CLOSE` troubleshooting sentences from the CI paragraph in `CLAUDE.md`, keeping the surrounding `.node-version` and `engines` guidance intact
- [x] 4.2 Re-read the edited paragraph end to end to confirm it still reads coherently without the removed sentences

## 5. Verify and land

- [x] 5.1 Run `pnpm run check` and confirm it passes
- [x] 5.2 Confirm no file under `dist/` and no part of `README.md` changed, so the no-changeset sizing decision holds
- [ ] 5.3 Open a PR to `main` and confirm the `Check` workflow passes
- [ ] 5.4 After the change lands and the next release runs, confirm the release produced an npm publish, a `v<version>` git tag, and a GitHub release — the observable proof the v1.9.0 breakage is gone
