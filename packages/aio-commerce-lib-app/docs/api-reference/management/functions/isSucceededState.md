# `isSucceededState()`

```ts
function isSucceededState(
  state: WorkflowRunState,
): state is SucceededWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:150](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L150)

Type guard for succeeded workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is SucceededWorkflowState`
