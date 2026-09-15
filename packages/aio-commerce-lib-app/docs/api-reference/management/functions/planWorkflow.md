# `planWorkflow()`

```ts
function planWorkflow(
  options: PlanWorkflowOptions,
): Promise<PlanWorkflowResult>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/plan.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/plan.ts#L42)

Runs each resource planner in order and aggregates its plans and issues.

## Parameters

| Parameter | Type                  | Description                                                     |
| --------- | --------------------- | --------------------------------------------------------------- |
| `options` | `PlanWorkflowOptions` | Options for planning every resource-capable leaf in a workflow. |

## Returns

`Promise`\<`PlanWorkflowResult`\>
