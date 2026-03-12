# `LeafStepOptions\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type LeafStepOptions<TName, TConfig, TStepCtx, TOutput> = Omit<
  LeafStep<TName, TConfig, TStepCtx, TOutput>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L138)

Options for defining a leaf step.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | -                               |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
