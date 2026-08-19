# `ValidationResult`

```ts
type ValidationResult = {
  result: StepValidationResult;
  summary: ValidationSummary;
  valid: boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L57)

The complete validation result returned by the validation endpoint.

## Properties

### result

```ts
result: StepValidationResult;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L65)

The full validation tree mirroring the step structure.

---

### summary

```ts
summary: ValidationSummary;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L68)

Flat summary of issue counts for quick frontend decisions.

---

### valid

```ts
valid: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L62)

Whether installation can proceed without any confirmation.
False if there are any error or warning severity issues.
