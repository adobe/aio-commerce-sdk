# `WebhooksConfig\<T *extends* `AnyCommerceAppConfig`=`CommerceAppConfigOutputModel`\>`

```ts
type WebhooksConfig<
  T extends AnyCommerceAppConfig = CommerceAppConfigOutputModel,
> = T & {
  webhooks: NonNullable<T["webhooks"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:177](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L177)

Config type when webhooks are present (non-empty array).

## Type Parameters

| Type Parameter                                                     | Default type                   |
| ------------------------------------------------------------------ | ------------------------------ |
| <a id="type-parameter-t"></a> `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |

## Type Declaration

### webhooks

```ts
webhooks: NonNullable<T["webhooks"]>;
```
