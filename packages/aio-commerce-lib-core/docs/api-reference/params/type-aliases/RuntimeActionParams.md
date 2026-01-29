# `RuntimeActionParams`

```ts
type RuntimeActionParams = {
  [key: string]: unknown;
  __ow_headers?: Record<string, string | undefined>;
  __ow_method?: string;
};
```

Defined in: [params/types.ts:14](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/params/types.ts#L14)

The type of the runtime action parameters.

## Indexable

```ts
[key: string]: unknown
```

## Properties

### \_\_ow_headers?

```ts
optional __ow_headers: Record<string, string | undefined>;
```

Defined in: [params/types.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/params/types.ts#L16)

If the runtime action is invoked via HTTP, this will be the headers of the request.

---

### \_\_ow_method?

```ts
optional __ow_method: string;
```

Defined in: [params/types.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/params/types.ts#L19)

If the runtime action is invoked via HTTP, this will be the HTTP method of the request.
