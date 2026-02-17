# `CreateInitialStateOptions`

```ts
type CreateInitialStateOptions = {
  config: CommerceAppConfigOutputModel;
  rootStep: BranchStep;
};
```

Defined in: [management/installation/workflow/runner.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L41)

Options for creating an initial installation state.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [management/installation/workflow/runner.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L46)

The app configuration used to determine applicable steps.

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [management/installation/workflow/runner.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L43)

The root branch step to build the state from.
