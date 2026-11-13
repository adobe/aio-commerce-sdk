# `createInitialState()`

```ts
function createInitialState(
  options: CreateInitialStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/engine.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/engine.ts#L96)

Creates an initial workflow run state from a root step and config.

Filters steps based on whether their domains are configured and builds a
tree structure with all steps set to "pending".

## Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `options` | `CreateInitialStateOptions` |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
