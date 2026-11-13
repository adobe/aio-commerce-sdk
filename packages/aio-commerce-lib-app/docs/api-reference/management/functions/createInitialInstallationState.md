# ~~`createInitialInstallationState()`~~

```ts
function createInitialInstallationState(
  options: CreateInitialInstallationStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L118)

Creates an initial installation state from the config and step definitions.
Filters steps based on their `when` conditions and builds a tree structure
with all steps set to "pending".

## Parameters

| Parameter | Type                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `options` | [`CreateInitialInstallationStateOptions`](../type-aliases/CreateInitialInstallationStateOptions.md) |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)

## Deprecated

The pre-lifecycle engine is removed in the next major. Drive installs
and uninstalls through the installation runtime action, which runs the lifecycle
plan/apply engine.
