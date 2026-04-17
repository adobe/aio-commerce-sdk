# `runInstallation()`

```ts
function runInstallation(
  options: RunInstallationOptions,
): Promise<SucceededInstallationState | FailedInstallationState>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:73](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L73)

Runs the full installation workflow. Returns the final state (never throws).

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `options` | [`RunInstallationOptions`](../type-aliases/RunInstallationOptions.md) |

## Returns

`Promise`\<
\| [`SucceededInstallationState`](../type-aliases/SucceededInstallationState.md)
\| [`FailedInstallationState`](../type-aliases/FailedInstallationState.md)\>
