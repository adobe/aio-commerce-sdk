# `executeUninstallWorkflow()`

```ts
function executeUninstallWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/runner.ts:145](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/runner.ts#L145)

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
