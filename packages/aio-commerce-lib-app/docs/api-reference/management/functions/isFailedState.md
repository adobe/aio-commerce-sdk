# `isFailedState()`

```ts
function isFailedState(state: WorkflowRunState): state is FailedWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:157](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L157)

Type guard for failed workflow run state.

## Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `state`   | [`WorkflowRunState`](../type-aliases/WorkflowRunState.md) |

## Returns

`state is FailedWorkflowState`
