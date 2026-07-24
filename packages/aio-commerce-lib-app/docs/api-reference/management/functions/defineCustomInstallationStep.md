# `defineCustomInstallationStep()`

```ts
function defineCustomInstallationStep<TResult>(
  handlerOrDefinition:
    | CustomInstallationStepHandler<TResult>
    | CustomInstallationStepDefinition<TResult>,
):
  | CustomInstallationStepHandler<TResult>
  | CustomInstallationStepDefinition<TResult>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L74)

Define a custom installation step with type-safe parameters.

This helper provides type safety and IDE autocompletion for custom installation scripts.
Accepts either a plain function (install only) or an object with `install` and optional
`uninstall` handlers.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `TResult`      | `unknown`    |

## Parameters

| Parameter             | Type                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handlerOrDefinition` | \| [`CustomInstallationStepHandler`](../type-aliases/CustomInstallationStepHandler.md)\<`TResult`\> \| [`CustomInstallationStepDefinition`](../type-aliases/CustomInstallationStepDefinition.md)\<`TResult`\> |

## Returns

\| [`CustomInstallationStepHandler`](../type-aliases/CustomInstallationStepHandler.md)\<`TResult`\>
\| [`CustomInstallationStepDefinition`](../type-aliases/CustomInstallationStepDefinition.md)\<`TResult`\>

## Examples

**Plain function (install only):**

```typescript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;
  logger.info(`Setting up ${config.metadata.displayName}...`);
  return { status: "success" };
});
```

**Object form with install and uninstall:**

```typescript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

export default defineCustomInstallationStep({
  install: async (config, context) => {
    context.logger.info(`Registering ${config.metadata.displayName}...`);
    return { status: "success" };
  },
  uninstall: async (config, context) => {
    context.logger.info(`Removing ${config.metadata.displayName}...`);
  },
});
```
