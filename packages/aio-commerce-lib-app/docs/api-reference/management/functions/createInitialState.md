# `createInitialState()`

```ts
function createInitialState(
  options: CreateInitialStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/engine.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/engine.ts#L96)

Creates an initial workflow run state from a root step and config.

Filters steps based on whether their domains are configured and builds a
tree structure with all steps set to "pending".

## Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `options` | `CreateInitialStateOptions` |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
