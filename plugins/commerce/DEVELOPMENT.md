# Development

## Local installation

Use `npx skills add` to install skills into a project for local testing. Run from inside
the target project — the CLI auto-detects the agent and installs to the right location.

```sh
cd ~/my-commerce-app

# Install all skills
npx skills add /path/to/aio-commerce-sdk/plugins/commerce/app-management --yes

# Install a specific skill only
npx skills add /path/to/aio-commerce-sdk/plugins/commerce/app-management --yes --skill commerce-app-init
```

## Authoring skills

### Frontmatter requirements

Always include `metadata.version` — without it the skill reviewer warns on every check:

```yaml
metadata:
  author: adobe
  sdk-package: "@adobe/aio-commerce-lib-app"
  version: "0.0.1" # increment when the skill changes meaningfully
```

### Inline examples are required

Asset files (`assets/`) are loaded on demand and are **not** visible to the reviewer
when scoring the skill. Every skill must include at least one minimal inline code
example in the body — enough that an agent can act on the skill without loading the
asset file. The asset file can still provide the full annotated reference.

Rule of thumb: if removing the asset file would make Step 3 ambiguous, the inline
example is missing.

### Asset constraints vs references

For config templates, put field constraints as inline comments in the asset file
(`assets/<config-file>`). This keeps the template and its constraints co-located and
avoids an extra fetch step for the agent.

For domain skills with complex schemas already documented in `usage.md`, use a
`references/` folder with a fetchable link to the source documentation instead of
duplicating constraints inline.

### Common Issues section

Only include failure modes that are **non-obvious** and not already covered by the
Step 2 validation table. Restating table constraints in prose adds noise without
value — a reader who hit the error will already have read the table.

## Tessl tile

Each plugin ships a single `tile.json` at its root (`plugins/commerce/<plugin>/tile.json`) — one tile per plugin, not one per skill, because the skills in a plugin are a cohesive family distributed as a unit.

The tile references all skills under the `skills` key. When adding a new skill to a plugin, add a matching entry:

```json
"skills": {
  "commerce-app-<name>": {
    "path": "skills/commerce-app-<name>/SKILL.md"
  }
}
```

`tile.json` and `.claude-plugin/plugin.json` carry the same `version` and `summary` — keep them in sync when either changes.

## Quality review

Before shipping a skill, run the tessl reviewer to catch structural and quality issues:

```sh
npx tessl skill review skills/<skill-name>
```

A passing skill has 0 errors and 0 warnings. The judge score should be ≥ 90%.
Common failure patterns: missing `metadata.version`, no inline code example, Common
Issues section that restates the validation table.

## Evaluations

Implemented skills ship with evals in `skills/<skill-name>/evals/evals.json`, following the [agentskills.io eval format](https://agentskills.io/skill-creation/evaluating-skills.md).

### Running evals

Install the `skill-creator` skill, which automates the eval loop:

```sh
# Claude Code plugin
/plugin marketplace add anthropics/skills
/plugin install skills@anthropics-skills

# Or via skills CLI
npx skills add anthropics/skills --skill skill-creator
```

Then ask your agent:

```
Run evals for the commerce-app-init skill
```

To run a single eval case instead of the full suite:

```
Run eval 1 for the commerce-app-init skill
```

The agent will run each prompt with and without the skill, grade assertions, and write results to a `<skill-name>-workspace/` directory alongside the skill folder. Running the full suite spawns multiple subagents in parallel and typically takes 2–5 minutes.

### Workspace directories

Eval results are written to `skills/<skill-name>-workspace/` and are excluded from version control. Only `evals/evals.json` is committed — it is the source of truth for what the skill is expected to do.
