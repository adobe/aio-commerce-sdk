# `createInitialPlanExecutionState()`

```ts
function createInitialPlanExecutionState(
  options: CreateInitialPlanExecutionStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/execute.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/execute.ts#L84)

Creates an initial execution state pruned to leaves with planned operations.

## Parameters

| Parameter | Type                                     |
| --------- | ---------------------------------------- |
| `options` | `CreateInitialPlanExecutionStateOptions` |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
