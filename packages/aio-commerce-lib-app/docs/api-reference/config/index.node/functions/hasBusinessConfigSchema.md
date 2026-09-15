# `hasBusinessConfigSchema()`

```ts
function hasBusinessConfigSchema<T extends AnyCommerceAppConfig>(
  config: T,
): config is T & {
  businessConfig: T["businessConfig"] & {
    schema: NonNullable<NonNullable<T["businessConfig"]>["schema"]>;
  };
};
```

Defined in: [aio-commerce-lib-app/source/config/schema/business-configuration.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/business-configuration.ts#L48)

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
