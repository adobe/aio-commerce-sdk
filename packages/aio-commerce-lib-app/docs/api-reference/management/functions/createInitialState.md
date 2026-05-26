# `createInitialState()`

```ts
function createInitialState(
  options: CreateInitialStateOptions,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:92](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L92)

Creates an initial installation state from a root step and config.

Filters steps based on their `when` conditions and builds a
tree structure with all steps set to "pending".

## Parameters

| Parameter | Type                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `options` | [`CreateInitialStateOptions`](../type-aliases/CreateInitialStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
