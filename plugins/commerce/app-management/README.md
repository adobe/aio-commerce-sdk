# Commerce App Management Skills

> ⚠️ **Experimental** — These skills are under active development and subject to change.

Agent skills for Adobe Commerce App Management, following the [agentskills.io](https://agentskills.io) open standard. Compatible with Claude Code, Cursor, VS Code Copilot, Gemini CLI, and other supported agents.

## Strategy

Skills are designed around a single responsibility: one skill per concern, chained together to build up a complete app.

`commerce-app-init` is the entry point. It scaffolds a bare app with metadata only — no domain configuration. Once the base app exists, domain skills extend it by adding extensibility components one at a time. This keeps each skill focused, independently installable, and stable on its own.

```
commerce-app-init
  └─→ commerce-app-eventing
  └─→ commerce-app-webhooks
  └─→ commerce-app-business-config
  └─→ commerce-app-admin-ui
  └─→ commerce-app-storage
```

A developer creating an app that needs events and webhooks would run `commerce-app-init` first, then chain to `commerce-app-eventing` and `commerce-app-webhooks` in any order.

## Available skills

| Skill                                                                  | Description                                | Status    |
| ---------------------------------------------------------------------- | ------------------------------------------ | --------- |
| [commerce-app-init](./skills/commerce-app-init/)                       | Scaffold a new Commerce app with metadata  | Available |
| [commerce-app-eventing](./skills/commerce-app-eventing/)               | Manage Commerce and external event sources | Available |
| [commerce-app-webhooks](./skills/commerce-app-webhooks/)               | Manage webhook interception                | Available |
| [commerce-app-business-config](./skills/commerce-app-business-config/) | Manage custom business configuration       | Available |
| [commerce-app-storage](./skills/commerce-app-storage/)                 | Integrate App Builder Database Storage     | Available |
| [commerce-app-admin-ui](./skills/commerce-app-admin-ui/)               | Extend the Commerce Admin UI               | Available |

## Installation

**Claude Code plugin:**

```sh
/plugin marketplace add adobe/aio-commerce-sdk
/plugin install commerce-app-management@adobe-aio-commerce-sdk
```

**Tessl CLI:**

```sh
tessl install github:adobe/aio-commerce-sdk --skills commerce-app-management
```

**pnpx skills:**

```sh
pnpx skills add adobe/aio-commerce-sdk --skill commerce-app-init
pnpx skills add adobe/aio-commerce-sdk --skill commerce-app-eventing
pnpx skills add adobe/aio-commerce-sdk --skill commerce-app-webhooks
pnpx skills add adobe/aio-commerce-sdk --skill commerce-app-business-config
pnpx skills add adobe/aio-commerce-sdk --skill commerce-app-storage
pnpx skills add adobe/aio-commerce-sdk --skill commerce-app-admin-ui
```

## Contributing

### Local testing

Install skills directly from a local checkout into a target project:

```sh
cd ~/my-commerce-app

# Install all skills
pnpx skills add /path/to/aio-commerce-sdk/plugins/commerce/app-management --yes

# Install a specific skill only
pnpx skills add /path/to/aio-commerce-sdk/plugins/commerce/app-management --yes --skill commerce-app-init
```

### Quality review

Before shipping a skill, run the tessl reviewer to catch structural and quality issues:

```sh
npx tessl skill review skills/<skill-name>
```

A passing skill has 0 errors and 0 warnings. The judge score should be ≥ 90%.

### Evaluations

Implemented skills ship with evals in `skills/<skill-name>/evals/evals.json`, following the [agentskills.io eval format](https://agentskills.io/skill-creation/evaluating-skills.md).

Install the `skill-creator` skill to automate the eval loop:

```sh
pnpx skills add anthropics/skills --skill skill-creator
```

Then ask your agent:

```
Run evals for the commerce-app-init skill
```

The agent runs each prompt with and without the skill, grades assertions, and writes results to `skills/<skill-name>-workspace/`. Eval results are excluded from version control — only `evals/evals.json` is committed.
