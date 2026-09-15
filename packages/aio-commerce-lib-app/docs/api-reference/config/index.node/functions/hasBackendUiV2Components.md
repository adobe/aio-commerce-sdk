# `hasBackendUiV2Components()`

```ts
function hasBackendUiV2Components<T extends AnyCommerceAppConfig>(
  config: T,
): config is AdminUiConfig<T>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/admin-ui.ts:427](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts#L427)

Check whether the config declares an Admin UI component that requires the
`commerce/backend-ui/2` extension point — a menu, grid columns, mass actions,
or view buttons. Custom ACL resources are deliberately excluded: they reach
Commerce through the `extensibility/1` app-config payload, not backend-ui/2,
so an acl-only config needs no backend-ui/2 registration.

## Type Parameters

| Type Parameter                       |
| ------------------------------------ |
| `T` _extends_ `AnyCommerceAppConfig` |

## Parameters

| Parameter | Type |
| --------- | ---- |
| `config`  | `T`  |

## Returns

`config is AdminUiConfig<T>`
