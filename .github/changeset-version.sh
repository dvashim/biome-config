#!/usr/bin/env bash
# Run `changeset version` with retries.
#
# The `@changesets/changelog-github` plugin queries the GitHub GraphQL API to
# enrich CHANGELOG entries, which intermittently fails with transient network
# errors (e.g. "Invalid response body ... Premature close"). `changeset version`
# aborts cleanly without writing files on such a failure, so retrying is safe.
set -uo pipefail

for attempt in 1 2 3; do
  if pnpm changeset version; then
    exit 0
  fi
  echo "::warning::changeset version attempt ${attempt} failed; retrying in 15s"
  sleep 15
done

echo "::error::changeset version failed after 3 attempts"
exit 1
