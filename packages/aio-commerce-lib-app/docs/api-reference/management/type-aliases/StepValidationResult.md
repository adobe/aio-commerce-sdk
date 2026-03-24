# `StepValidationResult`

```ts
type StepValidationResult = {
  children: StepValidationResult[];
  issues: ValidationIssue[];
  meta: StepMeta;
  name: string;
  path: string[];
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L27)

Validation result for a single step, mirroring the step hierarchy.

## Properties

### children

```ts
children: StepValidationResult[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L41)

Validation results for child steps (empty for leaf steps).

---

### issues

```ts
issues: ValidationIssue[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L38)

Issues found for this specific step (not including children).

---

### meta

```ts
meta: StepMeta;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L35)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L29)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L32)

Full path from root to this step.
