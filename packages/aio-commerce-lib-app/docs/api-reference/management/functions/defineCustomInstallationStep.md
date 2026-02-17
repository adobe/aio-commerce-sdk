# `defineCustomInstallationStep()`

```ts
function defineCustomInstallationStep<TResult>(
  handler: CustomInstallationStepHandler<TResult>,
): CustomInstallationStepHandler<TResult>;
```

Defined in: [management/installation/custom-installation/define.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L56)

Define a custom installation step with type-safe parameters.

This helper provides type safety and IDE autocompletion for custom installation scripts.
The handler function receives properly typed `config` and `context` parameters.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `TResult`      | `unknown`    |

## Parameters

| Parameter | Type                                                                                             | Description                            |
| --------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `handler` | [`CustomInstallationStepHandler`](../type-aliases/CustomInstallationStepHandler.md)\<`TResult`\> | The installation step handler function |

## Returns

[`CustomInstallationStepHandler`](../type-aliases/CustomInstallationStepHandler.md)\<`TResult`\>

The same handler function (for use as default export)

## Example

```typescript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;

  logger.info(`Setting up ${config.metadata.displayName}...`);

  // Your installation logic here
  // TypeScript will provide autocompletion for config and context

  return {
    status: "success",
    message: "Setup completed",
  };
});
```
