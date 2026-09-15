# `isCompletedState()`

```ts
function isCompletedState(
  state: WorkflowRunState,
): state is SucceededWorkflowState | FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:158](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L158)

Type guard for completed workflow run state (succeeded or failed).

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

state is SucceededWorkflowState \| FailedWorkflowState
