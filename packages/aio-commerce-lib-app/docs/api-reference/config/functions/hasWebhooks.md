# `hasWebhooks()`

```ts
function hasWebhooks<T>(
  config: T,
): config is T & { webhooks: NonNullable<T["webhooks"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:168](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L168)

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
