# `executeUninstallWorkflow()`

```ts
function executeUninstallWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededInstallationState | FailedInstallationState>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L146)

Executes an uninstall workflow from an initial state. Returns the final state (never throws).
Steps with an `uninstall` handler get it called; steps without are silently skipped.

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `options` | [`ExecuteWorkflowOptions`](../type-aliases/ExecuteWorkflowOptions.md) |

## Returns

`Promise`\<
\| [`SucceededInstallationState`](../type-aliases/SucceededInstallationState.md)
\| [`FailedInstallationState`](../type-aliases/FailedInstallationState.md)\>
