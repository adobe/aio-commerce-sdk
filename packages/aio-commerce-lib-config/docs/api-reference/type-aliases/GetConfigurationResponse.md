# `GetConfigurationResponse`

```ts
type GetConfigurationResponse = {
  config: ConfigValue[];
  scope: {
    code: string;
    id: string;
    level: string;
  };
};
```

Defined in: [types/api.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-config/source/types/api.ts#L32)

Response type for getting configuration for a scope.

## Properties

### config

```ts
config: ConfigValue[];
```

Defined in: [types/api.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-config/source/types/api.ts#L40)

Array of configuration values with their origins.

---

### scope

```ts
scope: {
  code: string;
  id: string;
  level: string;
}
```

Defined in: [types/api.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-config/source/types/api.ts#L34)

Scope information including id, code, and level.

#### code

```ts
code: string;
```

#### id

```ts
id: string;
```

#### level

```ts
level: string;
```
