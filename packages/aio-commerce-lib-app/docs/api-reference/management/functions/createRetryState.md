# `createRetryState()`

```ts
function createRetryState(
  failedState: FailedWorkflowState,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/runner.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/runner.ts#L110)

Creates a retry state from a failed state.
Preserves succeeded steps and their data so the workflow resumes from
the failed step rather than restarting from scratch.

## Parameters

| Parameter     | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| `failedState` | [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md) |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
