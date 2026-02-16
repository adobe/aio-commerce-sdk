# `BranchStep\<TName, TConfig, TStepCtx\>`

```ts
type BranchStep<TName, TConfig, TStepCtx> = StepBase<TName, TConfig> & {
  children: AnyStep[];
  context?: StepContextFactory<TStepCtx>;
  type: "branch";
};
```

Defined in: [management/installation/workflow/step.ts:88](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L88)

A branch step that contains children (no execution).

## Type Declaration

### children

```ts
children: AnyStep[];
```

The children steps of this branch.

### context?

```ts
optional context: StepContextFactory<TStepCtx>;
```

An optional factory function to setup shared context for the children steps.

### type

```ts
type: "branch";
```

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TName` _extends_ `string`                           | `string`                        |
| `TConfig` _extends_ `CommerceAppConfigOutputModel`   | `CommerceAppConfigOutputModel`  |
| `TStepCtx` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |
