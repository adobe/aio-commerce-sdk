# `WorkflowError\<TPayload = `unknown`\>`

```ts
type WorkflowError<TPayload = unknown> = {
  key: string;
  message?: string;
  path: string[];
  payload?: TPayload;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L24)

A structured error with path to the failing step.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `TPayload`     | `unknown`    |

## Properties

### key

```ts
key: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L29)

Error key for easy identification.

---

### message?

```ts
optional message?: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L32)

Human-readable error message.

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L26)

Path to the step that failed (e.g., ["eventing", "commerce", "providers"]).

---

### payload?

```ts
optional payload?: TPayload;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L35)

Additional error payload.
