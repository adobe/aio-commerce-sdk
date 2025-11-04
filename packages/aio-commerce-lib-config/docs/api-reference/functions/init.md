# `init()`

```ts
function init(_config?: LibConfig): {
  getConfigSchema: Promise<ConfigSchemaField[]>;
  getConfiguration: Promise<GetConfigurationResponse>;
  getConfigurationByKey: Promise<GetConfigurationByKeyResponse>;
  getScopeTree: Promise<{
    fallbackError?: string;
    isCachedData: boolean;
    scopeTree: ScopeTree;
  }>;
  setConfiguration: Promise<SetConfigurationResponse>;
  setCustomScopeTree: Promise<SetCustomScopeTreeResponse>;
  syncCommerceScopes: Promise<{
    error?: string;
    scopeTree: ScopeTree;
    synced: boolean;
  }>;
};
```

Defined in: [lib-config.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/lib-config.ts#L20)

Initialize the configuration library

## Parameters

| Parameter  | Type                                        |
| ---------- | ------------------------------------------- |
| `_config?` | [`LibConfig`](../type-aliases/LibConfig.md) |

## Returns

Initialized configuration instance

### getConfigSchema()

```ts
getConfigSchema(): Promise<ConfigSchemaField[]>;
```

Get configuration schema

#### Returns

`Promise`\<[`ConfigSchemaField`](../type-aliases/ConfigSchemaField.md)[]\>

### getConfiguration()

```ts
getConfiguration(...args: unknown[]): Promise<GetConfigurationResponse>;
```

Get configuration.

#### Parameters

| Parameter | Type        |
| --------- | ----------- |
| ...`args` | `unknown`[] |

#### Returns

`Promise`\<[`GetConfigurationResponse`](../type-aliases/GetConfigurationResponse.md)\>

### getConfigurationByKey()

```ts
getConfigurationByKey(configKey: string, ...args: unknown[]): Promise<GetConfigurationByKeyResponse>;
```

Get specific configuration value by key.

#### Parameters

| Parameter   | Type        | Description                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `configKey` | `string`    | The name of the configuration field to retrieve |
| ...`args`   | `unknown`[] | either (id) or (code, level)                    |

#### Returns

`Promise`\<[`GetConfigurationByKeyResponse`](../type-aliases/GetConfigurationByKeyResponse.md)\>

### getScopeTree()

```ts
getScopeTree(remoteFetch: boolean): Promise<{
  fallbackError?: string;
  isCachedData: boolean;
  scopeTree: ScopeTree;
}>;
```

Get the scope tree

#### Parameters

| Parameter     | Type      | Default value | Description                      |
| ------------- | --------- | ------------- | -------------------------------- |
| `remoteFetch` | `boolean` | `false`       | Whether to fetch Commerce scopes |

#### Returns

`Promise`\<\{
`fallbackError?`: `string`;
`isCachedData`: `boolean`;
`scopeTree`: [`ScopeTree`](../type-aliases/ScopeTree.md);
\}\>

Flattened scope tree as array with metadata about data freshness and any fallback information

### setConfiguration()

```ts
setConfiguration(request: SetConfigurationRequest, ...args: unknown[]): Promise<SetConfigurationResponse>;
```

Set configuration.

#### Parameters

| Parameter | Type                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `request` | [`SetConfigurationRequest`](../type-aliases/SetConfigurationRequest.md) |
| ...`args` | `unknown`[]                                                             |

#### Returns

`Promise`\<[`SetConfigurationResponse`](../type-aliases/SetConfigurationResponse.md)\>

### setCustomScopeTree()

```ts
setCustomScopeTree(request: SetCustomScopeTreeRequest): Promise<SetCustomScopeTreeResponse>;
```

Set custom scope tree

#### Parameters

| Parameter | Type                                                                        | Description                 |
| --------- | --------------------------------------------------------------------------- | --------------------------- |
| `request` | [`SetCustomScopeTreeRequest`](../type-aliases/SetCustomScopeTreeRequest.md) | Custom scopes to set/update |

#### Returns

`Promise`\<[`SetCustomScopeTreeResponse`](../type-aliases/SetCustomScopeTreeResponse.md)\>

Updated custom scope tree with generated IDs and timestamp

### syncCommerceScopes()

```ts
syncCommerceScopes(): Promise<{
  error?: string;
  scopeTree: ScopeTree;
  synced: boolean;
}>;
```

Sync Commerce scopes forces a fresh fetch from Commerce API

#### Returns

`Promise`\<\{
`error?`: `string`;
`scopeTree`: [`ScopeTree`](../type-aliases/ScopeTree.md);
`synced`: `boolean`;
\}\>

Sync result with updated scope tree and sync status
