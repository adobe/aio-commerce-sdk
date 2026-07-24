# `setSystemConfigByKey()`

```ts
function setSystemConfigByKey(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void>;
```

Defined in: [modules/configuration/system-config.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/modules/configuration/system-config.ts#L49)

Stores or clears a system configuration value by key.

Persists the value to `aio-lib-files` (source of truth) and caches it in
`aio-lib-state`. Passing `null` or `undefined` clears the entry from both
storage layers. System config is stored under the `system.*` namespace,
separate from scope-keyed Business Configuration.

## Parameters

| Parameter    | Type      | Default value                     | Description                                                                                                                |
| ------------ | --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `key`        | `string`  | `undefined`                       | The system configuration key (e.g. `"system.association"`).                                                                |
| `value`      | `unknown` | `undefined`                       | The value to store, or `null`/`undefined` to clear the entry.                                                              |
| `ttlSeconds` | `number`  | `SYSTEM_CONFIG_CACHE_TTL_SECONDS` | Cache TTL in seconds for the `aio-lib-state` entry. Defaults to 24 hours; `aio-lib-state` caps it at one year (31536000s). |

## Returns

`Promise`\<`void`\>
