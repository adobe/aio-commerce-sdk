# Commerce App Migration Skills

> ⚠️ **Experimental** — These skills are under active development and subject to change.

Agent skills for migrating Adobe Commerce App Builder projects to the App Management approach, following the [agentskills.io](https://agentskills.io) open standard. Compatible with Claude Code, Cursor, VS Code Copilot, Gemini CLI, and other supported agents.

## Available skills

| Skill                                                  | Description                                                                               | Status    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------- |
| [commerce-app-migrate](./skills/commerce-app-migrate/) | Orchestrate the full migration from Integration or Checkout Starter Kit to App Management | Available |

### `commerce-app-migrate`

Orchestrates the full migration workflow: project detection → domain analysis → Q&A → config assembly → execution. Run from the root of the App Builder project to be migrated.

```
/commerce-app-migrate
/commerce-app-migrate --auto   # skip confirmation prompts (CI or batch use)
```

**What it does:**

1. **Preflight** — verifies the directory contains a valid App Builder project (`app.config.yaml`, `package.json`, and an actions or source directory)
2. **Analyze** — detects starter kit type, auth mode, action packages, eventing, webhooks, Admin UI SDK usage, and business config
3. **Domain agents** — runs specialized agents in parallel for each detected domain (events, webhooks, Admin UI SDK, business config)
4. **Q&A** — asks targeted questions for anything that cannot be inferred automatically
5. **Config assembly** — generates `app.commerce.config.ts` with `defineConfig(...)` from `@adobe/aio-commerce-lib-app/config`
6. **Execute** — writes the config file and applies required project changes; identifies README.md sections and env.dist entries that may be outdated after migration and explains why each is no longer needed

**Supported source projects:** Integration Starter Kit, Checkout Starter Kit, Admin UI SDK extensions.

**Output:** A ready-to-deploy `app.commerce.config.ts` in the project root, with all detected domains mapped to the App Management configuration schema.

## Installation

**Claude Code plugin:**

```sh
/plugin marketplace add adobe/aio-commerce-sdk
/plugin install commerce-app-migration@adobe-aio-commerce-sdk
```

**Tessl CLI:**

```sh
tessl install github:adobe/aio-commerce-sdk --skills commerce-app-migrate
```

**npx skills:**

```sh
npx skills add adobe/aio-commerce-sdk --skill commerce-app-migrate
```
