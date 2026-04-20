# `SetConfigurationResponse`

```ts
type SetConfigurationResponse = {
  config: {
    name: string;
    value: BusinessConfigSchemaValue;
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

Defined in: [types/api.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L68)

Response type for setting configuration values.

## Properties

### config

```ts
config: {
  name: string;
  value: BusinessConfigSchemaValue;
}
[];
```

Defined in: [types/api.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L80)

Array of updated configuration values.

#### name

```ts
name: string;
```

#### value

```ts
value: BusinessConfigSchemaValue;
```

---

### message

```ts
message: string;
```

Defined in: [types/api.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L70)

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

Defined in: [types/api.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L74)

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

Defined in: [types/api.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L72)

ISO timestamp of when the configuration was updated.
