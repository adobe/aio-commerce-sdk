# `ValidationIssue`

```ts
type ValidationIssue = {
  code: string;
  details?: Record<string, unknown>;
  message: string;
  severity: ValidationIssueSeverity;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L27)

A single validation issue reported by a step's validate handler.

## Properties

### code

```ts
code: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L29)

Machine-readable code identifying the issue type.

---

### details?

```ts
optional details?: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L38)

Optional additional context about the issue.

---

### message

```ts
message: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L32)

Human-readable description of the issue.

---

### severity

```ts
severity: ValidationIssueSeverity;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L35)

Severity of the issue. Only "error" severity blocks the workflow.
