# `ValidateStepTreeOptions`

```ts
type ValidateStepTreeOptions = {
  config: CommerceAppConfigOutputModel;
  rootStep: BranchStep;
  validationContext: ValidationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/validation.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/validation.ts#L29)

Options for running validation over the step tree.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/validation.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/validation.ts#L37)

The app configuration used to determine applicable steps.

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/validation.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/validation.ts#L31)

The root branch step to validate.

---

### validationContext

```ts
validationContext: ValidationContext;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/validation.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/validation.ts#L34)

Validation context (params, logger, appData).
