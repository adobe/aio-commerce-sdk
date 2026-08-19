# `WebhooksConfig\<T\>`

```ts
type WebhooksConfig<T> = T & {
  webhooks: NonNullable<T["webhooks"]>;
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/webhooks.ts:163](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/schema/webhooks.ts#L163)

Config type when webhooks are present (non-empty array).

## Type Declaration

### webhooks

```ts
webhooks: NonNullable<T["webhooks"]>;
```

## Type Parameters

| Type Parameter                       | Default type                   |
| ------------------------------------ | ------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` | `CommerceAppConfigOutputModel` |
