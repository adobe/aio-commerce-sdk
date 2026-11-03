# `executeUninstallWorkflow()`

```ts
function executeUninstallWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/engine.ts:123](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/engine.ts#L123)

Executes an uninstall workflow from an initial state. Returns the final state (never throws).
Steps with an `uninstall` handler get it called; steps without are silently skipped.

## Parameters

| Parameter | Type                     |
| --------- | ------------------------ |
| `options` | `ExecuteWorkflowOptions` |

## Returns

`Promise`\<
\| [`SucceededWorkflowState`](../type-aliases/SucceededWorkflowState.md)
\| [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md)\>
