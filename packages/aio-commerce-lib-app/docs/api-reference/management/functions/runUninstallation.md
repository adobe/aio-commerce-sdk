# ~~`runUninstallation()`~~

```ts
function runUninstallation(
  options: RunUninstallationOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:251](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L251)

Runs the full uninstallation workflow. Returns the final state (never throws).

## Parameters

| Parameter | Type                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `options` | [`RunUninstallationOptions`](../type-aliases/RunUninstallationOptions.md) |

## Returns

`Promise`\<
\| [`SucceededWorkflowState`](../type-aliases/SucceededWorkflowState.md)
\| [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md)\>

## Deprecated

The pre-lifecycle engine is removed in the next major. Drive installs
and uninstalls through the installation runtime action, which runs the lifecycle
plan/apply engine.
