# `ValidationSummary`

```ts
type ValidationSummary = {
  errors: number;
  totalIssues: number;
  warnings: number;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L52)

Aggregated summary counts across the entire validation tree.

## Properties

### errors

```ts
errors: number;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L57)

Number of error-severity issues (these block the workflow).

---

### totalIssues

```ts
totalIssues: number;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L54)

Total number of issues across all steps.

---

### warnings

```ts
warnings: number;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L60)

Number of warning-severity issues (allow proceeding with confirmation).
