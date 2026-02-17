# `InstallationError\<TPayload\>`

```ts
type InstallationError<TPayload> = {
  key: string;
  message?: string;
  path: string[];
  payload?: TPayload;
};
```

Defined in: [management/installation/workflow/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L30)

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

Defined in: [management/installation/workflow/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L35)

Error key for easy identification.

---

### message?

```ts
optional message: string;
```

Defined in: [management/installation/workflow/types.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L38)

Human-readable error message.

---

### path

```ts
path: string[];
```

Defined in: [management/installation/workflow/types.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L32)

Path to the step that failed (e.g., ["eventing", "commerce", "providers"]).

---

### payload?

```ts
optional payload: TPayload;
```

Defined in: [management/installation/workflow/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L41)

Additional error payload.
