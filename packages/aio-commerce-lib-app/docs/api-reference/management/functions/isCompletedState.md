# `isCompletedState()`

```ts
function isCompletedState(
  state: WorkflowRunState,
): state is SucceededWorkflowState | FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:164](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L164)

Type guard for completed workflow run state (succeeded or failed).

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

state is SucceededWorkflowState \| FailedWorkflowState
