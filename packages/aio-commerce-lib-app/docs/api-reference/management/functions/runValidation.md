# `runValidation()`

```ts
function runValidation(
  options: RunValidationOptions,
): Promise<ValidationResult>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:150](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L150)

Runs pre-installation validation over the full step tree.

Traverses the same step hierarchy used during installation but only calls
each step's optional `validate` handler rather than executing side effects.
Always resolves (never throws). Returns a structured result with per-step
issues and an aggregated summary.

## Parameters

| Parameter | Type                                                              |
| --------- | ----------------------------------------------------------------- |
| `options` | [`RunValidationOptions`](../type-aliases/RunValidationOptions.md) |

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
