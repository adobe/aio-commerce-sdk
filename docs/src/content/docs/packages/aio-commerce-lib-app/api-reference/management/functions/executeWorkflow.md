---
title: "executeWorkflow()"
editUrl: false
prev: false
next: false
---

```ts
function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<SucceededInstallationState | FailedInstallationState>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L108)

Executes a workflow from an initial state. Returns the final state (never throws).

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `options` | [`ExecuteWorkflowOptions`](../type-aliases/ExecuteWorkflowOptions.md) |

## Returns

`Promise`\<
\| [`SucceededInstallationState`](../type-aliases/SucceededInstallationState.md)
\| [`FailedInstallationState`](../type-aliases/FailedInstallationState.md)\>
