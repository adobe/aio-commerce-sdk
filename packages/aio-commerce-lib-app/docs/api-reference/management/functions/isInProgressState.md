# `isInProgressState()`

```ts
function isInProgressState(
  state: WorkflowRunState,
): state is InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L143)

Type guard for in-progress workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is InProgressWorkflowState`
