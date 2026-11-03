# `isInProgressState()`

```ts
function isInProgressState(
  state: WorkflowRunState,
): state is InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L143)

Type guard for in-progress workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is InProgressWorkflowState`
