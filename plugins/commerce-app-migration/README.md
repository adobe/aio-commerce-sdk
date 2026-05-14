# commerce-app-migration

A Claude Code plugin that migrates Adobe Commerce App Builder projects from the Integration Starter Kit or Checkout Starter Kit to the new App Management approach using `@adobe/aio-commerce-lib-app`.

## Skills

### `commerce-app-migrate`

Orchestrates the full migration workflow: project detection → domain analysis → Q&A → config assembly → execution.

**Usage:** Run from the root of the App Builder project to be migrated.

```
/commerce-app-migrate
/commerce-app-migrate --auto
```

Pass `--auto` to skip all confirmation prompts (suitable for CI or batch use).

#### What it does

1. **Preflight** — verifies the directory contains a valid App Builder project (`app.config.yaml`, `package.json`, and an actions or source directory)
2. **Analyze** — detects starter kit type, auth mode, action packages, eventing, webhooks, Admin UI SDK usage, and business config
3. **Domain agents** — runs specialized agents in parallel for each detected domain (events, webhooks, Admin UI SDK, business config)
4. **Q&A** — asks targeted questions for anything that cannot be inferred automatically
5. **Config assembly** — generates `app.commerce.config.ts` with `defineConfig(...)` from `@adobe/aio-commerce-lib-app/config`
6. **Execute** — writes the config file and applies required project changes

#### Supported source projects

- Integration Starter Kit
- Checkout Starter Kit
- Admin UI SDK extensions

#### Output

A ready-to-deploy `app.commerce.config.ts` in the project root, with all detected domains mapped to the App Management configuration schema.

## Installation

**Claude Code plugin (recommended):**

```sh
/plugin marketplace add adobe/aio-commerce-sdk
/plugin install commerce-app-migration@adobe-aio-commerce-sdk
```

**Single skill via skills CLI:**

```sh
npx skills add adobe/aio-commerce-sdk --skill commerce-app-migrate
```

**All skills via skills CLI:**

```sh
npx skills add adobe/aio-commerce-sdk --all
```

## Requirements

- Claude Code with plugin support
- An App Builder project in the working directory when invoking the skill
