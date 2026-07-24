# `AdminUiPermissionClient`

```ts
type AdminUiPermissionClient = {
  check: (resource?: string) => Promise<boolean>;
  invalidate: (resource?: string) => void;
  require: (resource?: string) => Promise<void>;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L43)

Client for checking the current user's Admin UI SDK resource permissions.

## Properties

### check

```ts
check: (resource?: string) => Promise<boolean>;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L52)

Checks whether the current user has the given ACL resource granted.

#### Parameters

| Parameter   | Type     | Description                                                                          |
| ----------- | -------- | ------------------------------------------------------------------------------------ |
| `resource?` | `string` | The ACL resource id to check. When omitted, defaults to the id derived from `appId`. |

#### Returns

`Promise`\<`boolean`\>

`true` when granted; `false` when denied, on network or parse errors while `denyOnError` is
`true` (the default), or immediately when neither `resource` nor a valid `appId` is available.

#### Throws

[AdminUiPermissionError](../classes/AdminUiPermissionError.md) on HTTP 401, regardless of `denyOnError`.

---

### invalidate

```ts
invalidate: (resource?: string) => void;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L59)

Clears cached permission results.

#### Parameters

| Parameter   | Type     | Description                                                                                                                                                  |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resource?` | `string` | The ACL resource id whose cached result to clear. When omitted, clears all cached entries and in-flight tracking without aborting outstanding HTTP requests. |

#### Returns

`void`

---

### require

```ts
require: (resource?: string) => Promise<void>;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/permission-client.ts#L68)

Resolves when the current user has the given ACL resource granted.

#### Parameters

| Parameter   | Type     | Description                                                                            |
| ----------- | -------- | -------------------------------------------------------------------------------------- |
| `resource?` | `string` | The ACL resource id to require. When omitted, defaults to the id derived from `appId`. |

#### Returns

`Promise`\<`void`\>

#### Throws

[AdminUiPermissionDeniedError](../classes/AdminUiPermissionDeniedError.md) when the resource is explicitly denied.

#### Throws

[AdminUiPermissionError](../classes/AdminUiPermissionError.md) on HTTP 401, on network or parse errors while `denyOnError` is
`false`, or immediately when neither `resource` nor a valid `appId` is available.
