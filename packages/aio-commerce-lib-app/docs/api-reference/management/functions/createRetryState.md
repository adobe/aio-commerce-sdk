# `createRetryState()`

```ts
function createRetryState(
  failedState: FailedWorkflowState,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/retry.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/retry.ts#L24)

Creates a retry state from a failed state.
Preserves succeeded steps and their data so the workflow resumes from
the failed step rather than restarting from scratch.

## Parameters

| Parameter     | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| `failedState` | [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md) |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
