# Maintainers

This document covers responsibilities and operations reserved for project maintainers — the
actions that require elevated repository or GitHub Actions permissions, as opposed to the
day-to-day contributor workflow covered in [DEVELOPMENT.md](./DEVELOPMENT.md). See
[CONTRIBUTING.md](./CONTRIBUTING.md#from-contributor-to-committer) for how a contributor becomes
a committer.

## Release Process

See [DEVELOPMENT.md](./DEVELOPMENT.md#release-process) for the full release process overview
(semantic versioning, changesets workflow, branch channels, snapshot flow). The following steps
require maintainer-level access to execute.

### Requesting a PR snapshot

Commenting `/snapshot` on an open PR publishes an `alpha` snapshot of that PR's changes to
Artifactory without affecting `main`. The workflow that handles this comment checks that the
commenter has **admin** permission on the repository, so this is restricted to maintainers.

### Triggering a public release

When ready to publish to npm, use the **Promote to Release** workflow dispatch (`promote.yml`):

1. Trigger it from GitHub Actions, optionally specifying a commit SHA on `main` to promote (defaults to latest).
2. The workflow merges that commit directly into `release` via a merge commit. No config changes needed — changeset files come along unconsumed.
3. Changesets creates/updates a `[CI] Release Packages` PR on `release`, including regenerated API reference docs.
4. Merging that PR publishes stable versions to npm and writes changelogs.

If there were snapshot versions like `1.2.5-beta-20260313T120000` on Artifactory, the resulting stable release is `1.2.5`.

### Back-sync

After a public release, the back-sync is automatic — the workflow merges `release` directly into `main` via a merge commit. No manual step needed.

### Hotfixes

Urgent public fixes should be applied via a PR directly into `release` (patch changeset only) so the fix gets reviewed before going live. Once merged, changesets automatically opens a `[CI] Release Packages` PR — merge it to publish to npm. The back-sync to `main` runs automatically after publish.

### Repository secrets and deploy key

The promotion and back-sync workflows push directly to `main` and `release`, both of which are protected branches. To allow this without a full admin bypass, the repository uses an SSH **deploy key** with write access, stored as the `DEPLOY_KEY` Actions secret.

The corresponding public key is registered as a repository deploy key. Its `actor_id` is added to the branch ruleset as a `DeployKey` bypass actor (with `bypass_mode: always`), so CI pushes can land on protected branches without going through a pull request.

If the deploy key ever needs to be rotated:

1. Generate a new ed25519 key pair: `ssh-keygen -t ed25519 -C "ci deploy key" -f /tmp/deploy-key -N ""`
2. Add the public key under **Settings → Deploy keys** (enable write access) and note the new key ID.
3. Update the `DEPLOY_KEY` Actions secret with the new private key.
4. Update the ruleset bypass actor with the new key ID via `gh api`.

The Commerce plugin promotion step also requires an `ADOBE_SKILLS_TOKEN` Actions secret. Provision
it as a fine-grained GitHub personal access token with the following settings:

- **Resource owner:** `adobe`
- **Repository access:** `adobe/skills` only
- **Permissions:** Metadata (read), Contents (read/write), Pull requests (read/write)
- **Expiration:** 366 days (the maximum); set a calendar reminder to regenerate it before it
  expires, then update the `ADOBE_SKILLS_TOKEN` Actions secret with the new value.
