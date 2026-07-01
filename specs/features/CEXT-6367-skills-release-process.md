# Skills Release Process

- **Ticket:** [CEXT-6367](https://jira.corp.adobe.com/browse/CEXT-6367)
- **Created:** 2026-06-23
- [ ] **Implemented**

## Summary

Define a repeatable, automated process for promoting plugins from `adobe/aio-commerce-sdk` —
where skills are developed and tested — to `adobe/skills`, the stable channel that production
consumers install from. Plugins use the same changeset-based release workflow as npm packages,
giving authors a single, consistent process regardless of what they are shipping.

## Motivation

Plugins in `adobe/aio-commerce-sdk` are the development channel: experimental, subject to
change without notice. The stable channel is `adobe/skills`, which users are directed to for
production use. Without a defined promotion process, there is no clear path from development
to stable, no versioning contract for consumers, and no automation to reduce manual effort.

The lack of a process creates two concrete problems:

1. **Skills are effectively unreleased.** Commerce plugins exist in the SDK repo but are not
   reachable from `adobe/skills`, so production consumers cannot install them through the
   stable channel.
2. **Ad-hoc promotion is error-prone.** Without a defined process, promotion requires manual
   file copying across repos, with no traceability, no review gate, and no rollback path.

**Goals:**

- Give plugins in `adobe/aio-commerce-sdk` a clear, repeatable promotion path to the stable
  channel.
- Use the same changeset workflow already established for npm packages, so authors learn one
  process.
- Automate the mechanical work of opening a PR in `adobe/skills` as part of the existing
  release pipeline.
- Keep the process consistent with existing SDK workflow conventions (PR-gated, traceable to
  source commits).

**Non-goals:**

- Publishing plugins as npm packages.
- Changing skill authoring conventions beyond what this spec explicitly covers.
- Allowing changes in `adobe/skills` to flow back into the SDK repo automatically or
  manually — changes always originate in `adobe/aio-commerce-sdk`.
- Defining how `adobe/skills` itself publishes or distributes content downstream.

## Developer experience

### Skill author

When a meaningful skill change is ready, the author's workflow mirrors what they already do for
SDK package changes:

1. Update the skill content.
2. Run `pnpm changeset add` and select the plugin package (e.g.
   `@adobe/aio-commerce-plugin-app-management`) with the appropriate semver bump.
3. Write a user-facing changeset description — what developers can now do or what changed for
   them.
4. Open a PR. A feature PR may include changesets for both SDK packages and plugins, or for
   either one alone.
5. Merge to `main`.

The promotion to `adobe/skills` happens automatically as part of the next release cycle. No
manual file copying, no version fields to update by hand.

**Skills that reference unreleased SDK APIs:** do not include a plugin changeset in a PR until
the SDK package that the skill describes has been published to npm. Including it earlier would
promote skill instructions that describe APIs consumers cannot yet install. Because changesets
for plugins and SDK packages travel through the same Release PR, the timing is naturally correct
when both changesets appear in the same PR — the plugin version bumps at the same moment the
SDK packages publish.

### Release manager

The release flow is unchanged. Promote main to the `release` branch as normal. The changesets
action creates or updates the Release PR, which now includes version bumps for both SDK packages
and any plugin `package.json` files that have pending changesets. Merging the Release PR
publishes SDK packages to npm and triggers the plugin promotion step.

For skill-only Release PRs (no SDK package changes), no npm packages publish and the Slack
notification in `publish-public.yml` does not fire — this is expected. Only the promotion step
runs.

### Consumer

Consumers install from `adobe/skills` using the tooling defined by that repository. The
installed skills reflect the latest version merged into `adobe/skills`. The version consumers
see is reflected in `tile.json` and `.claude-plugin/plugin.json`.

## Design

### Plugin naming and paths

Each plugin is identified consistently across the three contexts it appears in:

| Folder in this repo                | Package name                                | `tile.json` name                | Target path in `adobe/skills`      |
| ---------------------------------- | ------------------------------------------- | ------------------------------- | ---------------------------------- |
| `plugins/commerce/app-management/` | `@adobe/aio-commerce-plugin-app-management` | `adobe/commerce-app-management` | `plugins/commerce/app-management/` |
| `plugins/commerce/app-migration/`  | `@adobe/aio-commerce-plugin-app-migration`  | `adobe/commerce-app-migration`  | `plugins/commerce/app-migration/`  |

The target path in `adobe/skills` mirrors the folder layout in this repository.

### Plugin packages

Each plugin gains a `package.json` at its root and is registered as a pnpm workspace member
by adding `plugins/commerce/*` to `pnpm-workspace.yaml`. The package is `private: true` so it
is never published to npm. Its sole purpose is to give the changeset toolchain a versioned
target to manage.

```json
{
  "name": "@adobe/aio-commerce-plugin-app-management",
  "version": "1.1.1",
  "private": true,
  "scripts": {
    "version": "node scripts/sync-plugin-version.js"
  }
}
```

The existing `release:version` script (`changeset version && turbo run version && turbo run docs`)
already invokes `turbo run version` after bumping versions. The `version` turbo task is already
defined in `turbo.json`. Adding a `version` script to each plugin `package.json` is enough —
Turborepo picks it up automatically. That script reads the bumped version from `package.json`
and writes it into `tile.json` and `.claude-plugin/plugin.json`, keeping those files consistent.
`package.json` is the authoritative version source; `tile.json` and `.claude-plugin/plugin.json`
must not be edited manually for version changes.

### Workspace registration

`pnpm-workspace.yaml` currently lists `packages/*`, `packages-private/*`, `configs/*`,
`scripts`, and `turbo/*`. Adding `plugins/commerce/*` registers plugins as workspace members so
changesets can manage their versions. No other workspace tooling changes are required — plugins
do not participate in `turbo build`, `turbo test`, or any compile step.

### Changeset configuration

Registering private plugin packages as workspace members has the following interactions with
the existing `.changeset/config.json` and `publish-public.yml`:

- **Publishing:** `changeset publish` (called via `release:publish`) skips `private: true`
  packages automatically. Plugin packages are never published to npm.
- **GitHub Releases:** `createGithubReleases: true` in the changesets action creates releases
  only for packages that were actually published. Private plugin packages produce no GitHub
  releases.
- **Slack notification:** The `notify-slack` step in `publish-public.yml` is gated on
  `steps.changesets.outputs.published == 'true'`. This flag is `true` only when at least one
  npm package published. Skill-only releases do not trigger the Slack notification — expected
  behaviour.
- **CHANGELOGs:** Changesets generates a `CHANGELOG.md` per package, including private ones.
  Plugin packages receive a `CHANGELOG.md` at their root, which serves as the source for the
  promotion PR body (see below).

### Trigger and detection

Plugin promotion runs as a step in the existing `publish-public.yml` workflow, immediately
after the changesets action completes. Because private plugin packages do not appear in the
changesets action's `publishedPackages` output, the step detects changed plugins by diffing the
Release PR merge commit against its first parent:

```bash
git diff HEAD^1 HEAD -- plugins/commerce/*/package.json
```

Any plugin whose `version` field changed in that diff is included in the promotion PR. This
approach is deterministic, requires no external state, and works correctly for both skill-only
and mixed releases.

### Promotion artifact

CI opens a single PR in `adobe/skills` covering all plugins that had a version bump. Each
plugin's content is copied to its target path (see naming table above).

The copied content for each plugin is `tile.json`, `README.md`, `skills/`, and `.claude-plugin/`
— excluding `package.json` and `CHANGELOG.md`, which are internal to the SDK repo. Before
copying, the promotion step rewrites the `repository` field in `.claude-plugin/plugin.json`
from `https://github.com/adobe/aio-commerce-sdk` to `https://github.com/adobe/skills`, so
that Claude Code resolves the plugin's source to its stable location.

The promotion step creates or updates the target directories in `adobe/skills` as needed —
there is no manual seed PR required for the first promotion.

PR metadata:

- **Branch:** `promote/adobe-aio-commerce-sdk` (fixed name, force-pushed on each release so
  there is at most one open promotion PR at any time)
- **Title:** `feat(commerce): promote plugins from adobe/aio-commerce-sdk@<short-sha>` (where
  `<short-sha>` is the 7-character prefix of the Release PR merge commit on `release`)
- **Author:** `github-actions[bot]`
- **Body:** one section per changed plugin, each containing a bullet list drawn from the plugin's
  `CHANGELOG.md` for the released version:

  ```markdown
  ## commerce-app-management v1.2.0

  - Add commerce-app-admin-ui skill for Admin UI SDK grid columns and mass actions.
  - Fix commerce-app-init asset path for monorepo projects.

  ## commerce-app-migration v1.1.0

  - Add support for migrating Checkout Starter Kit webhooks configuration.
  ```

The PR in `adobe/skills` is the explicit human gate. Merging it is what makes skills available
on the stable channel.

If a promotion PR is already open when a new release runs, the force-push updates the existing
PR's branch and body. Reviewers see the updated diff and do not need to close and reopen. If the
existing PR had already been partially reviewed, the force-push resets the review state —
reviewers should re-check the diff.

### Plugin vs SDK release cadence

Plugins follow an independent release cadence from npm packages. A changeset targeting a plugin
package is the release intent for skills; a changeset targeting an SDK package is the release
intent for npm. They are separate signals and can appear in the same PR or in separate PRs.

| Change type         | Changeset targets                               | What it triggers                  |
| ------------------- | ----------------------------------------------- | --------------------------------- |
| Skill-only          | Plugin package (`@adobe/aio-commerce-plugin-*`) | Skill promotion to `adobe/skills` |
| SDK package only    | SDK package (`@adobe/aio-commerce-lib-*`)       | npm publish                       |
| Both in the same PR | Both                                            | npm publish, then skill promotion |

### Versioning

`package.json` is the authoritative version source. `tile.json` and `.claude-plugin/plugin.json`
are derived from it via the `version` turbo task and must not be edited manually for version
changes.

Per-skill `metadata.version` in `SKILL.md` frontmatter is removed. The
[agentskills.io specification](https://agentskills.io/specification) defines `metadata` as an
arbitrary key-value map with no semantics — no consuming tool reads `metadata.version`
specifically. With changesets providing a clear, consumer-facing version signal at the plugin
level, per-skill versions are redundant and create maintenance overhead with no downstream
benefit. Existing `SKILL.md` files in the repository carry `metadata.version` entries; these
are stripped as part of the implementation. The `AGENTS.md` rule requiring `metadata.version`
to be incremented is removed.

Semver rules for plugin changesets:

- `patch` — wording, examples, or minor clarifications with no behavioral change.
- `minor` — new skills added, new references or assets, behavioral changes that are additive.
- `major` — skills removed, a skill rename that breaks existing installs, or behavioral changes
  that break existing usage patterns.

### README authoring rules

Plugin `README.md` files are authored to be stable-channel-ready from the start and are copied
verbatim by the promotion script. The following rules apply and are codified in
`plugins/commerce/AGENTS.md` as part of this spec's implementation:

- Installation commands reference `adobe/skills`, not `adobe/aio-commerce-sdk`.
- No experimental banners (e.g. `⚠️ Experimental`).
- No contributor-only sections (local testing, quality review, evals workflow). That content
  belongs in `plugins/commerce/AGENTS.md` or `plugins/commerce/README.md`.

Developer-facing content for contributors is consolidated at the `plugins/commerce/` level,
not duplicated into individual plugin READMEs.

### Rollback

If a promoted skill is found to be broken after merging into `adobe/skills`, the fix is to ship
a new patch changeset in `adobe/aio-commerce-sdk` and go through the normal release cycle.
Reverting the promotion PR directly in `adobe/skills` is not the intended mechanism — the SDK
repo is the source of truth and the next promotion will overwrite `adobe/skills` regardless.

### Edge cases

**Skill-only release (no SDK package changes).** Fully supported. The Release PR contains only
plugin version bumps. No npm packages publish; only the promotion step runs.

**First promotion (bootstrap).** The target directories (`plugins/commerce/app-management/`,
`plugins/commerce/app-migration/`) do not yet exist in `adobe/skills`. The promotion step
creates them. No manual seed PR is required.

**Plugin removed from the SDK.** Out of scope for this spec. Deprecation and removal of skills
from `adobe/skills` requires a separate process.

## Drawbacks

- Each plugin gains a `package.json`, making it look structurally like an npm package even
  though it does not publish to npm. Authors familiar with the repo need to understand this
  distinction.
- The promotion PR in `adobe/skills` requires a reviewer's attention on every release that
  touches a plugin. As the number of plugins and release frequency grows, this becomes a
  recurring maintenance burden.
- Plugin releases are gated on the `promote` step (main → release), which is manually
  triggered. A skill-only fix cannot ship without going through the same release cycle as npm
  packages.
- Skill-only releases do not trigger the Slack notification, so they are less visible to the
  team than npm releases.

## Rationale and alternatives

**Why changesets rather than a `tile.json` version bump as the trigger?**
Changesets are already how SDK authors express release intent. Using them for plugins keeps one
workflow for everything — authors learn one command (`pnpm changeset add`), one review process
(Release PR), and one promotion mechanism. A separate `tile.json` bump convention would split
the release surface: two version signals to remember, two places to look to understand what
changed, and two sets of rules to document and enforce.

**Why a `package.json` per plugin rather than a custom script that reads changeset bodies?**
The changesets toolchain works natively with `package.json` files. Intercepting changeset body
text with a custom script would require duplicating version-bumping logic, wiring it into the
release pipeline manually, and keeping it in sync with upstream changeset changes. Registering
plugins as workspace packages costs one small file per plugin; the toolchain does the rest.

**Why drop `metadata.version` from `SKILL.md`?**
The agentskills.io specification defines `metadata` as an arbitrary key-value map. No consuming
tool assigns semantics to `metadata.version` specifically — it was a convention without
downstream effect. With the plugin `package.json` version surfaced in `tile.json` as the
consumer-facing signal, `metadata.version` serves no purpose and requires authors to maintain
two version signals per change.

**Why independent cadence from npm releases?**
Skills can improve without any SDK code change (better examples, fixed instructions, new use
cases). Coupling skill releases rigidly to npm releases would block these improvements and
require authors to create SDK changesets for changes that touch no package.

**What is the impact of not doing this?**
Commerce plugins remain unreachable from the stable channel. The `plugins/commerce/README.md`
already directs users to install from `adobe/skills`, but no commerce plugins land there — a
contradiction that erodes trust in the documentation.

## Unresolved questions

- **Write access to `adobe/skills`.** The promotion step needs a deploy key or GitHub App with
  write access to open PRs in `adobe/skills`. The provisioning path is not covered here.

## Future possibilities

No substantial follow-on is planned at this time. The process is designed to be self-contained:
authors use changesets, releases flow through the existing pipeline, and `adobe/skills` is
updated as a side effect. If the number of plugins grows significantly, batching or parallelising
the promotion step may become worth revisiting.
