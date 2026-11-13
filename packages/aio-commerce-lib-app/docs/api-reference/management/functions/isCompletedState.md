# `isCompletedState()`

```ts
function isCompletedState(
  state: WorkflowRunState,
): state is SucceededWorkflowState | FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:164](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L164)

Type guard for completed workflow run state (succeeded or failed).

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

state is SucceededWorkflowState \| FailedWorkflowState
