# `createInitialState()`

```ts
function createInitialState(
  options: CreateInitialStateOptions,
): InProgressWorkflowState;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/runner.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/runner.ts#L91)

Creates an initial workflow run state from a root step and config.

Filters steps based on whether their domains are configured and builds a
tree structure with all steps set to "pending".

## Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `options` | `CreateInitialStateOptions` |

## Returns

[`InProgressWorkflowState`](../type-aliases/InProgressWorkflowState.md)
