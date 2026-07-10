# Commerce Plugins

Agent skills for Adobe Commerce App Builder development, following the [agentskills.io](https://agentskills.io) open standard.

## Plugins

| Plugin                                       | Description                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [app-management](./app-management/README.md) | Scaffold and configure Commerce apps using the aio-commerce-sdk                               |
| [app-migration](./app-migration/README.md)   | Migrate an App Builder project from the Integration or Checkout Starter Kit to App Management |

## Distribution channels

Skills are available through two channels with different stability guarantees:

| Channel    | Source                                            | Stability                             | When to use                                       |
| ---------- | ------------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| **Latest** | This repo (`adobe/aio-commerce-sdk`)              | Experimental — may change at any time | Contributors, early adopters, unreleased features |
| **Stable** | [`adobe/skills`](https://github.com/adobe/skills) | Production-ready, tested releases     | Everyone else                                     |

For most developers, install from `adobe/skills`. The commands in each plugin's README target the stable channel.

## Contributing

See [AGENTS.md](./AGENTS.md) for authoring guidelines.

### Local testing

Install skills directly from a local checkout into a target project:

```sh
cd ~/my-commerce-app
pnpx skills add /path/to/aio-commerce-sdk/plugins/commerce/app-management --yes
pnpx skills add /path/to/aio-commerce-sdk/plugins/commerce/app-migration --yes
```

### Quality review and evals

Before shipping a skill, run the Tessl reviewer from the plugin directory:

```sh
pnpx tessl skill review skills/<skill-name>
```

Implemented skills may include evals in `skills/<skill-name>/evals/evals.json`. Eval results are excluded from version control; only `evals/evals.json` is committed.
