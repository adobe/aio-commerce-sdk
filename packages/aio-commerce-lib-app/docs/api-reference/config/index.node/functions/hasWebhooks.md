# `hasWebhooks()`

```ts
function hasWebhooks<T>(
  config: T,
): config is T & { webhooks: NonNullable<T["webhooks"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:173](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L173)

Check if config has webhooks (non-empty array).

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { webhooks: NonNullable<T["webhooks"]> }`
