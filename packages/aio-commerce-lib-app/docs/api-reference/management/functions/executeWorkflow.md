# `executeWorkflow()`

```ts
function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/runner.ts:135](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/runner.ts#L135)

Executes a workflow from an initial state. Returns the final state (never throws).

## Parameters

| Parameter | Type                     |
| --------- | ------------------------ |
| `options` | `ExecuteWorkflowOptions` |

## Returns

`Promise`\<
\| [`SucceededWorkflowState`](../type-aliases/SucceededWorkflowState.md)
\| [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md)\>
