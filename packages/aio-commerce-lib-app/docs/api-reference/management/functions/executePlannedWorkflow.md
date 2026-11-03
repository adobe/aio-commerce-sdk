# `executePlannedWorkflow()`

```ts
function executePlannedWorkflow(
  options: ExecutePlannedWorkflowOptions,
): Promise<PlannedWorkflowResult>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/execute.ts:157](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/execute.ts#L157)

Executes the `apply` methods selected by a persisted lifecycle plan.

## Parameters

| Parameter | Type                            |
| --------- | ------------------------------- |
| `options` | `ExecutePlannedWorkflowOptions` |

## Returns

`Promise`\<`PlannedWorkflowResult`\>
