# `ConfigManager`

Defined in: [config-manager.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L27)

## Constructors

### Constructor

```ts
new ConfigManager(config?: LibConfig): ConfigManager;
```

Defined in: [config-manager.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L34)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `config?` | [`LibConfig`](../interfaces/LibConfig.md) |

#### Returns

`ConfigManager`

## Methods

### getConfiguration()

```ts
getConfiguration(...args: unknown[]): Promise<GetConfigurationResponse>;
```

Defined in: [config-manager.ts:120](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L120)

Get configuration for a scope identified by code and level or id.

#### Parameters

| Parameter | Type        | Description                  |
| --------- | ----------- | ---------------------------- |
| ...`args` | `unknown`[] | either (id) or (code, level) |

#### Returns

`Promise`\<[`GetConfigurationResponse`](../interfaces/GetConfigurationResponse.md)\>

---

### getConfigurationByKey()

```ts
getConfigurationByKey(configKey: string, ...args: unknown[]): Promise<GetConfigurationByKeyResponse>;
```

Defined in: [config-manager.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L137)

Get a specific configuration value by key for a scope identified by code and level or id.

#### Parameters

| Parameter   | Type        | Description                                     |
| ----------- | ----------- | ----------------------------------------------- |
| `configKey` | `string`    | The name of the configuration field to retrieve |
| ...`args`   | `unknown`[] | either (id) or (code, level)                    |

#### Returns

`Promise`\<[`GetConfigurationByKeyResponse`](../interfaces/GetConfigurationByKeyResponse.md)\>

Promise resolving to configuration response with single config value

---

### getSchema()

```ts
getSchema(): Promise<ConfigSchemaField[]>;
```

Defined in: [config-manager.ts:106](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L106)

Get the configuration schema with lazy initialization and version checking

#### Returns

`Promise`\<[`ConfigSchemaField`](../interfaces/ConfigSchemaField.md)[]\>

---

### getScopeTree()

```ts
getScopeTree(remoteFetch: boolean): Promise<{
  fallbackError?: string;
  isCachedData: boolean;
  scopeTree: ScopeTree;
}>;
```

Defined in: [config-manager.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L44)

Get scope tree and optionally refresh commerce scopes from Commerce API

#### Parameters

| Parameter     | Type      | Default value | Description                            |
| ------------- | --------- | ------------- | -------------------------------------- |
| `remoteFetch` | `boolean` | `false`       | Whether to fetch fresh Commerce scopes |

#### Returns

`Promise`\<\{
`fallbackError?`: `string`;
`isCachedData`: `boolean`;
`scopeTree`: [`ScopeTree`](../type-aliases/ScopeTree.md);
\}\>

Scope tree as array with metadata about data freshness and any fallback information

---

### setConfiguration()

```ts
setConfiguration(request: SetConfigurationRequest, ...args: unknown[]): Promise<SetConfigurationResponse>;
```

Defined in: [config-manager.ts:152](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L152)

Set configuration for a scope identified by code and level or id.

#### Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `request` | [`SetConfigurationRequest`](../interfaces/SetConfigurationRequest.md) |
| ...`args` | `unknown`[]                                                           |

#### Returns

`Promise`\<[`SetConfigurationResponse`](../interfaces/SetConfigurationResponse.md)\>

---

### setCustomScopeTree()

```ts
setCustomScopeTree(request: SetCustomScopeTreeRequest): Promise<SetCustomScopeTreeResponse>;
```

Defined in: [config-manager.ts:169](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L169)

Set custom scope tree

#### Parameters

| Parameter | Type                                                                      | Description          |
| --------- | ------------------------------------------------------------------------- | -------------------- |
| `request` | [`SetCustomScopeTreeRequest`](../interfaces/SetCustomScopeTreeRequest.md) | Custom scopes to set |

#### Returns

`Promise`\<[`SetCustomScopeTreeResponse`](../interfaces/SetCustomScopeTreeResponse.md)\>

Response with updated custom scopes

---

### syncCommerceScopes()

```ts
syncCommerceScopes(): Promise<{
  error?: string;
  scopeTree: ScopeTree;
  synced: boolean;
}>;
```

Defined in: [config-manager.ts:66](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/config-manager.ts#L66)

Sync Commerce scopes forces a fresh fetch from Commerce API and updates cache

#### Returns

`Promise`\<\{
`error?`: `string`;
`scopeTree`: [`ScopeTree`](../type-aliases/ScopeTree.md);
`synced`: `boolean`;
\}\>

Sync result with updated scope tree and sync status
