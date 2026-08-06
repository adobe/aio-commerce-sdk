# `ValidationSummary`

```ts
type ValidationSummary = {
  errors: number;
  totalIssues: number;
  warnings: number;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L45)

Aggregated summary counts across the entire validation tree.

## Properties

### errors

```ts
errors: number;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L50)

Number of error-severity issues (these block installation).

---

### totalIssues

```ts
totalIssues: number;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L47)

Total number of issues across all steps.

---

### warnings

```ts
warnings: number;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/validation.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/workflow/validation.ts#L53)

Number of warning-severity issues (allow proceeding with confirmation).
