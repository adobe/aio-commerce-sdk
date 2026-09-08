# `getAdminUiPermissionClient()`

```ts
function getAdminUiPermissionClient(
  options: AdminUiPermissionClientOptions,
): AdminUiPermissionClient;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L101)

Creates a client for checking Admin UI SDK ACL resources.

## Parameters

| Parameter | Type                                                                                  | Description                                                                                                    |
| --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `options` | [`AdminUiPermissionClientOptions`](../type-aliases/AdminUiPermissionClientOptions.md) | Client configuration; see [AdminUiPermissionClientOptions](../type-aliases/AdminUiPermissionClientOptions.md). |

## Returns

[`AdminUiPermissionClient`](../type-aliases/AdminUiPermissionClient.md)

An [AdminUiPermissionClient](../type-aliases/AdminUiPermissionClient.md) for checking and requiring ACL resources.
