# ~~`runValidation()`~~

```ts
function runValidation(
  options: RunValidationOptions,
): Promise<ValidationResult>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:299](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L299)

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

## Deprecated

The pre-lifecycle engine is removed in the next major. The lifecycle
has no equivalent step-tree validation pass yet.
