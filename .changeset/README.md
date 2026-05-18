`.changeset` is for **release/version management** (via the

`.changeset` is for **release/version management** (via the Changesets tool) in monorepos like this one.

### What it does

- Stores small markdown files describing changes (what package changed + version bump type: patch/minor/major).
- On release, these files are consumed to:
    - bump package versions,
    - generate/update changelogs,
    - prepare publish/release PRs.

### Typical contents

- `.changeset/*.md` → individual change entries
- `.changeset/config.json` → changesets behavior/config

### Why it matters here

In a monorepo (`apps/*`, `packages/*`), it keeps releases consistent when shared packages change (e.g., `packages/surveys`, `packages/types`).

### Common workflow

1. Make code change.
2. Run `changeset` command (usually `pnpm changeset`).
3. Commit generated file in `.changeset/`.
4. CI/release process later applies version bumps.