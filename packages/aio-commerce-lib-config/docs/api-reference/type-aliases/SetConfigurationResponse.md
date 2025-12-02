# `SetConfigurationResponse`

```ts
type SetConfigurationResponse = {
  config: {
    name: string;
    value: AcceptableConfigValue;
  }[];
  message: string;
  scope: {
    code: string;
    id: string;
    level: string;
  };
  timestamp: string;
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:73](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L73)

Response type for setting configuration values.

## Properties

### config

```ts
config: {
  name: string;
  value: AcceptableConfigValue;
}
[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L85)

Array of updated configuration values.

#### name

```ts
name: string;
```

#### value

```ts
value: AcceptableConfigValue;
```

---

### message

```ts
message: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L75)

Success message.

---

### scope

```ts
scope: {
  code: string;
  id: string;
  level: string;
}
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:79](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L79)

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

---

### timestamp

```ts
timestamp: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L77)

ISO timestamp of when the configuration was updated.
