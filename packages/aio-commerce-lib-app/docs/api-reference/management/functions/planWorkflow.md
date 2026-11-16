# `planWorkflow()`

```ts
function planWorkflow(
  options: PlanWorkflowOptions,
): Promise<PlanWorkflowResult>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/plan.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/plan.ts#L52)

Runs each resource planner in order and aggregates its plans and issues.

## Parameters

| Parameter | Type                  | Description                                                     |
| --------- | --------------------- | --------------------------------------------------------------- |
| `options` | `PlanWorkflowOptions` | Options for planning every resource-capable leaf in a workflow. |

## Returns

`Promise`\<`PlanWorkflowResult`\>
