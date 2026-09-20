# `executePlannedWorkflow()`

```ts
function executePlannedWorkflow(
  options: ExecutePlannedWorkflowOptions,
): Promise<PlannedWorkflowResult>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/execute.ts:130](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/execute.ts#L130)

Executes the `apply` methods selected by a persisted lifecycle plan.

## Parameters

| Parameter | Type                            |
| --------- | ------------------------------- |
| `options` | `ExecutePlannedWorkflowOptions` |

## Returns

`Promise`\<`PlannedWorkflowResult`\>
