# `ValidationIssue`

```ts
type ValidationIssue = {
  code: string;
  details?: Record<string, unknown>;
  message: string;
  severity: ValidationIssueSeverity;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L25)

A single validation issue reported by a step's validate handler.

## Properties

### code

```ts
code: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L27)

Machine-readable code identifying the issue type.

---

### details?

```ts
optional details: Record<string, unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L36)

Optional additional context about the issue.

---

### message

```ts
message: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L30)

Human-readable description of the issue.

---

### severity

```ts
severity: ValidationIssueSeverity;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L33)

Severity of the issue. Only "error" severity blocks installation.
