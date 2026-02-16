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

Defined in: [aio-commerce-lib-config/source/types/api.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/api.ts#L46)

Response type for getting a single configuration value by key.

## Properties

### config

```ts
config: ConfigValue | null;
```

Defined in: [aio-commerce-lib-config/source/types/api.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/api.ts#L54)

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

Defined in: [aio-commerce-lib-config/source/types/api.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/api.ts#L48)

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
