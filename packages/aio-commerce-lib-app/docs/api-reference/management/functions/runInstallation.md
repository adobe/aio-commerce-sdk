# ~~`runInstallation()`~~

```ts
function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededWorkflowState | FailedWorkflowState>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L137)

Runs the full installation workflow. Returns the final state (never throws).

Retries once on failure. `onInstallationFailure` only fires if both attempts
fail; `isRetry: true` is set on the result when the retry succeeds.

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `options` | [`RunInstallationOptions`](../type-aliases/RunInstallationOptions.md) |

## Returns

`Promise`\<
\| [`SucceededWorkflowState`](../type-aliases/SucceededWorkflowState.md)
\| [`FailedWorkflowState`](../type-aliases/FailedWorkflowState.md)\>

## Deprecated

The pre-lifecycle engine is removed in the next major. Drive installs
and uninstalls through the installation runtime action, which runs the lifecycle
plan/apply engine.
