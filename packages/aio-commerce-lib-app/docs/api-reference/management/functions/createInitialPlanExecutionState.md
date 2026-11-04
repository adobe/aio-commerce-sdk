# `createInitialPlanExecutionState()`

```ts
function createInitialPlanExecutionState(
  options: CreateInitialPlanExecutionStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/execute.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/execute.ts#L87)

Creates an initial execution state pruned to leaves with planned operations. A leaf with config
changes but no operations, because its items are already in place, is kept as `succeeded`.

## Parameters

| Parameter | Type                                     |
| --------- | ---------------------------------------- |
| `options` | `CreateInitialPlanExecutionStateOptions` |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
