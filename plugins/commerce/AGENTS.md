# Agent guidelines — Commerce plugins

Rules for modifying skills in `plugins/commerce/`. Follow these whenever you add, edit, or review a skill.

## Plugin releases

Each plugin is a private pnpm workspace package. Use changesets to express release intent:

1. Run `pnpm changeset add`.
2. Select the plugin package, for example `@adobe/aio-commerce-plugin-app-management`.
3. Choose the semver bump for the plugin change.
4. Write a concise, user-facing changeset message.

Do not manually bump versions in `.tessl-plugin/plugin.json` or `.claude-plugin/plugin.json`. The
plugin `package.json` is the authoritative version source; release automation syncs that version
into the plugin manifests.

Plugin semver rules:

- `patch` — wording, examples, or minor clarifications with no behavioral change.
- `minor` — new skills, new references or assets, or additive behavioral changes.
- `major` — removed skills, renamed skills that break installs, or behavioral changes that break existing usage patterns.

When adding a new skill to a plugin, also add its directory to `.tessl-plugin/plugin.json`'s
`skills` array:

```json
"skills": ["skills/commerce-app-<name>"]
```

## Plugin README files

Plugin `README.md` files are copied verbatim to `adobe/skills` and must be stable-channel-ready:

- Installation commands reference `adobe/skills`, not `adobe/aio-commerce-sdk`.
- Do not add experimental banners.
- Do not include contributor-only sections such as local testing, quality review, or eval workflows. Put contributor guidance in this file or `plugins/commerce/README.md`.

## Skill frontmatter

Each `SKILL.md` must open with a YAML frontmatter block. Required fields:

- `name` — kebab-case identifier; must match the skill's directory name as referenced in `.tessl-plugin/plugin.json`'s `skills` array
- `description` — multi-line routing description (use `>` block scalar); written to tell the agent _when_ to invoke the skill, not to describe its contents
- `license` — always `Apache-2.0`
- `compatibility` — runtime and package requirements (use `>` block scalar)
- `metadata.author` — always `adobe`

```yaml
---
name: commerce-app-example
description: >
  One or two sentences that tell the agent when to use this skill.
license: Apache-2.0
compatibility: >
  Requires Node.js 22+, aio CLI, and @adobe/aio-commerce-lib-app.
  Requires a base app initialized with commerce-app-init.
metadata:
  author: adobe
---
```

## Inline examples are required

Asset files (`assets/`) are loaded on demand and are **not** visible to the agent when it first reads the skill. Every skill must include at least one minimal inline code example in the body — enough that an agent can act without fetching the asset file.

Rule of thumb: if removing the asset file would make a step ambiguous, the inline example is missing.

## Asset constraints vs reference files

For config templates, put field constraints as inline comments directly in the asset file. This keeps the template and its constraints co-located.

For domain skills with complex schemas already documented in `usage.md`, use a `references/` folder with a fetchable link instead of duplicating constraints inline.

## Common Issues section

Only include failure modes that are non-obvious and not already covered by the validation table in the skill body. Restating table constraints in prose adds noise — a reader who hit the error will already have read the table.
