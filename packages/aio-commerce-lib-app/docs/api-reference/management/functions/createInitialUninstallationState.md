# ~~`createInitialUninstallationState()`~~

```ts
function createInitialUninstallationState(
  options: CreateInitialUninstallationStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:233](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L233)

Creates an initial uninstallation state from the config and step definitions.

## Parameters

| Parameter | Type                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `options` | [`CreateInitialUninstallationStateOptions`](../type-aliases/CreateInitialUninstallationStateOptions.md) |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)

## Deprecated

The pre-lifecycle engine is removed in the next major. Drive installs
and uninstalls through the installation runtime action, which runs the lifecycle
plan/apply engine.
