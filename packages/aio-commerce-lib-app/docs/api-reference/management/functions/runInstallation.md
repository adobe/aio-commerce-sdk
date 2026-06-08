# `runInstallation()`

```ts
function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededInstallationState | FailedInstallationState>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L78)

Runs the full installation workflow. Returns the final state (never throws).

Retries once on failure. `onInstallationFailure` only fires if both attempts fail;
`isRetry: true` is set on the result when the retry succeeds.

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `options` | [`RunInstallationOptions`](../type-aliases/RunInstallationOptions.md) |

## Returns

`Promise`\<
\| [`SucceededInstallationState`](../type-aliases/SucceededInstallationState.md)
\| [`FailedInstallationState`](../type-aliases/FailedInstallationState.md)\>
