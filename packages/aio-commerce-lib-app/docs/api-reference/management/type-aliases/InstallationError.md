# `InstallationError\<TPayload\>`

```ts
type InstallationError<TPayload> = {
  key: string;
  message?: string;
  path: string[];
  payload?: TPayload;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L31)

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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L36)

Error key for easy identification.

---

### message?

```ts
optional message?: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L39)

Human-readable error message.

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L33)

Path to the step that failed (e.g., ["eventing", "commerce", "providers"]).

---

### payload?

```ts
optional payload?: TPayload;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:42](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L42)

Additional error payload.
