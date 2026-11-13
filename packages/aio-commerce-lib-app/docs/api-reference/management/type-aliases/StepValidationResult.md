# `StepValidationResult`

```ts
type StepValidationResult = {
  children: StepValidationResult[];
  issues: ValidationIssue[];
  meta: StepMetaInfo;
  name: string;
  path: string[];
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L34)

Validation result for a single step, mirroring the step hierarchy.

## Properties

### children

```ts
children: StepValidationResult[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L48)

Validation results for child steps (empty for leaf steps).

---

### issues

```ts
issues: ValidationIssue[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L45)

Issues found for this specific step (not including children).

---

### meta

```ts
meta: StepMetaInfo;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L42)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L36)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L39)

Full path from root to this step.
