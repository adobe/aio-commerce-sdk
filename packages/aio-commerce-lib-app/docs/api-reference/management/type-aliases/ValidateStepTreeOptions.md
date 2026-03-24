# `ValidateStepTreeOptions`

```ts
type ValidateStepTreeOptions = {
  config: CommerceAppConfigOutputModel;
  rootStep: BranchStep;
  validationContext: ValidationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L72)

Options for running validation over the step tree.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L80)

The app configuration used to determine applicable steps.

---

### rootStep

```ts
rootStep: BranchStep;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L74)

The root branch step to validate.

---

### validationContext

```ts
validationContext: ValidationContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L77)

Validation context (params, logger, appData).
