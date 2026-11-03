# `isSucceededState()`

```ts
function isSucceededState(
  state: WorkflowRunState,
): state is SucceededWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:150](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L150)

Type guard for succeeded workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is SucceededWorkflowState`
