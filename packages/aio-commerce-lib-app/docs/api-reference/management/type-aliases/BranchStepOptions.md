# `BranchStepOptions\<TName *extends* `string`, TConfig *extends* `CommerceAppConfigOutputModel`, TStepCtx *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>, TChildren *extends* [`AnyStep`](AnyStep.md)[] = [`AnyStep`](AnyStep.md)[]\>`

```ts
type BranchStepOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TChildren extends AnyStep[] = AnyStep[],
> = Omit<BranchStep<TName, TConfig, TStepCtx, TChildren>, "type">;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:250](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L250)

Options for defining a branch step.

## Type Parameters

| Type Parameter                                                                            | Default type                    |
| ----------------------------------------------------------------------------------------- | ------------------------------- |
| <a id="type-parameter-tname"></a> `TName` _extends_ `string`                              | -                               |
| <a id="type-parameter-tconfig"></a> `TConfig` _extends_ `CommerceAppConfigOutputModel`    | -                               |
| <a id="type-parameter-tstepctx"></a> `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
| <a id="type-parameter-tchildren"></a> `TChildren` _extends_ [`AnyStep`](AnyStep.md)[]     | [`AnyStep`](AnyStep.md)[]       |
