---
title: "executeUninstallWorkflow()"
editUrl: false
prev: false
next: false
---

```ts
function executeUninstallWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededInstallationState | FailedInstallationState>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L118)

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
