# `hasBusinessConfigSchema()`

```ts
function hasBusinessConfigSchema<T>(config: T): config is T & {
  businessConfig: T["businessConfig"] & {
    schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L45)

Check if config has business config schema.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| `config`  | `T`  | The configuration to check. |

## Returns

`config is T & { businessConfig: T["businessConfig"] & { schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]> } }`
