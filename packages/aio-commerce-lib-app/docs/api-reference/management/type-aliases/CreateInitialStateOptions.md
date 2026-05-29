# `CreateInitialStateOptions`

```ts
type CreateInitialStateOptions = {
  config: CommerceAppConfigOutputModel;
  mode?: ExecutionMode;
  rootStep: BranchStep;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L41)

Options for creating an initial installation state.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L46)

The app configuration used to determine applicable steps.

---

### mode?

```ts
optional mode?: ExecutionMode;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L49)

The execution mode. When "uninstall", steps use `meta.uninstall` if defined; defaults to "install".

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/runner.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/runner.ts#L43)

The root branch step to build the state from.
