---
title: "ValidationSummary"
editUrl: false
prev: false
next: false
---

```ts
type ValidationSummary = {
  errors: number;
  totalIssues: number;
  warnings: number;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L45)

Aggregated summary counts across the entire validation tree.

## Properties

### errors

```ts
errors: number;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L50)

Number of error-severity issues (these block installation).

---

### totalIssues

```ts
totalIssues: number;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L47)

Total number of issues across all steps.

---

### warnings

```ts
warnings: number;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L53)

Number of warning-severity issues (allow proceeding with confirmation).
