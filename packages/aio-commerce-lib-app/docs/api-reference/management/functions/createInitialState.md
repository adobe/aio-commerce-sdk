# `createInitialState()`

```ts
function createInitialState(
  options: CreateInitialStateOptions,
): InProgressInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L85)

Creates an initial installation state from a root step and config.

Filters steps based on their `when` conditions and builds a
tree structure with all steps set to "pending".

## Parameters

| Parameter | Type                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `options` | [`CreateInitialStateOptions`](../type-aliases/CreateInitialStateOptions.md) |

## Returns

[`InProgressInstallationState`](../type-aliases/InProgressInstallationState.md)
