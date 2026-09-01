# `getSystemConfigByKey()`

```ts
function getSystemConfigByKey<T>(
  key: string,
  ttlSeconds?: number,
): Promise<T | null>;
```

Defined in: [modules/configuration/system-config.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-config/source/modules/configuration/system-config.ts#L74)

Retrieves a system configuration value by key.

Reads from the `aio-lib-state` cache first, falling back to `aio-lib-files`
and re-caching. Returns `null` when the key is not found in either layer.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `unknown`    |

## Parameters

| Parameter    | Type     | Default value                     | Description                                                                                                                                            |
| ------------ | -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `key`        | `string` | `undefined`                       | The system configuration key (e.g. `"system.association"`).                                                                                            |
| `ttlSeconds` | `number` | `SYSTEM_CONFIG_CACHE_TTL_SECONDS` | Cache TTL in seconds applied when re-caching a value read from `aio-lib-files`. Defaults to 24 hours; `aio-lib-state` caps it at one year (31536000s). |

## Returns

`Promise`\<`T` \| `null`\>

The stored value cast to `T`, or `null` if not found.
