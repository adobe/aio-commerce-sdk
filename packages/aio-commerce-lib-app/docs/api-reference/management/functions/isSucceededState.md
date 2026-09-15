# `isSucceededState()`

```ts
function isSucceededState(
  state: WorkflowRunState,
): state is SucceededWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:144](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L144)

Type guard for succeeded workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is SucceededWorkflowState`
