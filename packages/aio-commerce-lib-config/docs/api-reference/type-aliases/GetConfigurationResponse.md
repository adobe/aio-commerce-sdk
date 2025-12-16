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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L32)

Response type for getting configuration for a scope.

## Properties

### config

```ts
config: ConfigValue[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L40)

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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L34)

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
