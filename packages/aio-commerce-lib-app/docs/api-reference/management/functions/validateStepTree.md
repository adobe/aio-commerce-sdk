# `validateStepTree()`

```ts
function validateStepTree(
  options: ValidateStepTreeOptions,
): Promise<ValidationResult>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/validation.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/validation.ts#L48)

Runs validation over the full step tree, returning a structured result.

- Skips steps whose domains are not represented in the configuration
- Calls each step's optional `validate` handler
- Sets up branch context factories before validating children
- Never throws; all errors from validate handlers are caught and reported as issues

## Parameters

| Parameter | Type                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `options` | [`ValidateStepTreeOptions`](../type-aliases/ValidateStepTreeOptions.md) |

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
