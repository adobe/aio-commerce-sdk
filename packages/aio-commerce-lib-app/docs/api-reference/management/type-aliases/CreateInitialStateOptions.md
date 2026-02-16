# `CreateInitialStateOptions`

```ts
type CreateInitialStateOptions = {
  config: CommerceAppConfigOutputModel;
  rootStep: BranchStep;
};
```

Defined in: [management/installation/workflow/runner.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L41)

Options for creating an initial installation state.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [management/installation/workflow/runner.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L46)

The app configuration used to determine applicable steps.

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [management/installation/workflow/runner.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L43)

The root branch step to build the state from.
