# Development

## Authoring skills

### Asset constraints vs references

For config templates, put field constraints as inline comments in the asset file
(`assets/<config-file>`). This keeps the template and its constraints co-located and
avoids an extra fetch step for the agent.

For domain skills with complex schemas already documented in `usage.md`, use a
`references/` folder with a fetchable link to the source documentation instead of
duplicating constraints inline.

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
