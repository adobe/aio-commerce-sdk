# Agent guidelines — Commerce plugins

Rules for modifying skills in `plugins/commerce/`. Follow these whenever you add, edit, or review a skill.

## Skill frontmatter

Every skill SKILL.md must include `metadata.version`. Increment it whenever the skill changes meaningfully (wording, logic, chaining, examples):

```yaml
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
  version: "0.0.1" # increment when the skill changes meaningfully
```

## Plugin version files

`tile.json` and `.claude-plugin/plugin.json` at the plugin root carry the same `version` and `summary`. Bump both in lockstep whenever skills in the plugin change:

```json
{ "version": "1.1.1" }
```

When adding a new skill to a plugin, also add a matching entry to `tile.json`:

```json
"skills": {
  "commerce-app-<name>": {
    "path": "skills/commerce-app-<name>/SKILL.md"
  }
}
```

## Inline examples are required

Asset files (`assets/`) are loaded on demand and are **not** visible to the agent when it first reads the skill. Every skill must include at least one minimal inline code example in the body — enough that an agent can act without fetching the asset file.

Rule of thumb: if removing the asset file would make a step ambiguous, the inline example is missing.

## Asset constraints vs reference files

For config templates, put field constraints as inline comments directly in the asset file. This keeps the template and its constraints co-located.

For domain skills with complex schemas already documented in `usage.md`, use a `references/` folder with a fetchable link instead of duplicating constraints inline.

## Common Issues section

Only include failure modes that are non-obvious and not already covered by the validation table in the skill body. Restating table constraints in prose adds noise — a reader who hit the error will already have read the table.
