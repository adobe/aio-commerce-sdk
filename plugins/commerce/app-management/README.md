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
```

A developer creating an app that needs events and webhooks would run `commerce-app-init` first, then chain to `commerce-app-eventing` and `commerce-app-webhooks` in any order.

## Available skills

| Skill                                                                  | Description                                | Status    |
| ---------------------------------------------------------------------- | ------------------------------------------ | --------- |
| [commerce-app-init](./skills/commerce-app-init/)                       | Scaffold a new Commerce app with metadata  | Available |
| [commerce-app-eventing](./skills/commerce-app-eventing/)               | Manage Commerce and external event sources | Available |
| [commerce-app-webhooks](./skills/commerce-app-webhooks/)               | Manage webhook interception                | Available |
| [commerce-app-business-config](./skills/commerce-app-business-config/) | Manage custom business configuration       | Available |

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

**npx skills:**

```sh
npx skills add adobe/aio-commerce-sdk --skill commerce-app-init
npx skills add adobe/aio-commerce-sdk --skill commerce-app-eventing
npx skills add adobe/aio-commerce-sdk --skill commerce-app-webhooks
npx skills add adobe/aio-commerce-sdk --skill commerce-app-business-config
```
