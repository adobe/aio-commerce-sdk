# `GetConfigurationByKeyResponse`

```ts
type GetConfigurationByKeyResponse = {
  config: ConfigValue | null;
  scope: {
    code: string;
    id: string;
    level: string;
  };
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L46)

Response type for getting a single configuration value by key.

## Properties

### config

```ts
config: ConfigValue | null;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L54)

The configuration value, or null if not found.

---

### scope

```ts
scope: {
  code: string;
  id: string;
  level: string;
}
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L48)

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
