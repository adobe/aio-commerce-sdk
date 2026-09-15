# `ValidateStepTreeOptions`

```ts
type ValidateStepTreeOptions = {
  config: CommerceAppConfigOutputModel;
  rootStep: BranchStep;
  validationContext: ValidationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L72)

Options for running validation over the step tree.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L80)

The app configuration used to determine applicable steps.

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L74)

The root branch step to validate.

---

### validationContext

```ts
validationContext: ValidationContext;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L77)

Validation context (params, logger, appData).
