# `validateStepTree()`

```ts
function validateStepTree(
  options: ValidateStepTreeOptions,
): Promise<ValidationResult>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L91)

Runs validation over the full step tree, returning a structured result.

- Respects `when` conditions (skips steps that don't apply to the config)
- Calls each step's optional `validate` handler
- Sets up branch context factories before validating children
- Never throws; all errors from validate handlers are caught and reported as issues

## Parameters

| Parameter | Type                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `options` | [`ValidateStepTreeOptions`](../type-aliases/ValidateStepTreeOptions.md) |

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
