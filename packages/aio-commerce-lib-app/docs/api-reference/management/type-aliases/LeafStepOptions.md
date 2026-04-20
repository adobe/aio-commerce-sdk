# `LeafStepOptions\<TName, TConfig, TStepCtx, TOutput\>`

```ts
type LeafStepOptions<TName, TConfig, TStepCtx, TOutput> = Omit<
  LeafStep<TName, TConfig, TStepCtx, TOutput>,
  "type"
>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:214](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L214)

Options for defining a leaf step.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | -                               |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | -                               |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| `TOutput`                                            | `unknown`                       |
