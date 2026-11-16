# `hasWebhooks()`

```ts
function hasWebhooks<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & { webhooks: NonNullable<T["webhooks"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:187](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L187)

Check if config has webhooks (non-empty array).

## Type Parameters

| Type Parameter                                                     |
| ------------------------------------------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { webhooks: NonNullable<T["webhooks"]> }`
