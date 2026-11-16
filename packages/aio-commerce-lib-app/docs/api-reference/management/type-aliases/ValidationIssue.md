# `ValidationIssue`

```ts
type ValidationIssue = {
  code: string;
  details?: Record<string, unknown>;
  message: string;
  severity: ValidationIssueSeverity;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L19)

A single validation issue reported by a step's validation.

## Properties

### code

```ts
code: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L21)

Machine-readable code identifying the issue type.

---

### details?

```ts
details?: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L30)

Optional additional context about the issue.

---

### message

```ts
message: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L24)

Human-readable description of the issue.

---

### severity

```ts
severity: ValidationIssueSeverity;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/validation.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/validation.ts#L27)

Severity of the issue. Only "error" severity blocks the workflow.
