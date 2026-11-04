# `ValidationResult`

```ts
type ValidationResult = {
  result: StepValidationResult;
  summary: ValidationSummary;
  valid: boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L64)

The complete validation result returned by the validation endpoint.

## Properties

### result

```ts
result: StepValidationResult;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L72)

The full validation tree mirroring the step structure.

---

### summary

```ts
summary: ValidationSummary;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L75)

Flat summary of issue counts for quick frontend decisions.

---

### valid

```ts
valid: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L69)

Whether the workflow can proceed without any confirmation.
False if there are any error or warning severity issues.
