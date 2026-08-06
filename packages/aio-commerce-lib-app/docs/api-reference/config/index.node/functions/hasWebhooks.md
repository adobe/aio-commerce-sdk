# `hasWebhooks()`

```ts
function hasWebhooks<T>(
  config: T,
): config is T & { webhooks: NonNullable<T["webhooks"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:173](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L173)

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
