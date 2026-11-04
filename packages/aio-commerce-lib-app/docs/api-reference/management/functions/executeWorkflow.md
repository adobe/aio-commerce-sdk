# `executeWorkflow()`

```ts
function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/engine.ts:113](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/engine.ts#L113)

Executes a workflow from an initial state. Returns the final state (never throws).

## Parameters

| Parameter | Type                     |
| --------- | ------------------------ |
| `options` | `ExecuteWorkflowOptions` |

## Returns

`Promise`\<
\| [`SucceededWorkflowState`](../type-aliases/SucceededWorkflowState.md)
\| [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md)\>
