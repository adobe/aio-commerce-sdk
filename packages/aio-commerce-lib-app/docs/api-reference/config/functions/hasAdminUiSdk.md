# `hasAdminUiSdk()`

```ts
function hasAdminUiSdk<T>(
  config: T,
): config is T & { adminUiSdk: NonNullable<T["adminUiSdk"]> };
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui-sdk.ts:339](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-app/source/config/schema/admin-ui-sdk.ts#L339)

**`Experimental`**

Check if config has Admin UI SDK registration configuration.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `config`  | `T`  |

## Returns

`config is T & { adminUiSdk: NonNullable<T["adminUiSdk"]> }`
