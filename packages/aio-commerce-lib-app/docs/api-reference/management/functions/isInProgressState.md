# `isInProgressState()`

```ts
function isInProgressState(
  state: WorkflowRunState,
): state is InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L137)

Type guard for in-progress workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is InProgressWorkflowState`
